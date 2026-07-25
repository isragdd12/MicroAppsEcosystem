import { and, eq, isNull, type SQL } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import { v4 as uuidv4 } from 'uuid';

import { syncQueueTable } from './syncQueueTable';
import type { SyncableTable } from './syncableTable';

export class ValidationError extends Error {
  public override cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.cause = cause;
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/** Sync SQLite database handle — both better-sqlite3 (tests) and
 * expo-sqlite's Drizzle driver (app runtime) are synchronous. */
export type SqliteDb = BaseSQLiteDatabase<'sync', unknown>;

function nowIso(): string {
  return new Date().toISOString();
}

export interface RepositoryOptions<TTable extends SyncableTable, TCreateInput> {
  db: SqliteDb;
  table: TTable;
  /** Postgres schema this table mirrors to, e.g. "petcare" — see docs/SUPABASE.md. */
  tableSchema: string;
  /** Table name as it appears in both SQLite and the Postgres mirror. */
  tableName: string;
  /** Validates+narrows create input before it's persisted (see docs/DATABASE.md). */
  validateCreateInput: (input: TCreateInput) => TCreateInput;
  /** Reads the current signed-in user's id, or null if anonymous/offline (see docs/SQLITE.md). */
  getOwnerId: () => string | null;
}

/**
 * Generic base repository — the only code allowed to read/write SQLite,
 * per docs/DATABASE.md. Feature-specific repositories (PetRepository,
 * FeedRepository) extend this and add domain query methods; this class
 * itself must never know about any concrete entity's domain fields.
 *
 * Every mutating call also appends a sync_queue row in the same
 * transaction as the domain write (the outbox pattern — see
 * docs/SYNC_ENGINE.md). Drizzle's query builder types don't track a
 * generic table shape precisely (its generics are designed for a
 * concrete, statically-known schema) — the targeted `as` casts below are
 * the accepted cost of a generic repository built on top of it; every
 * concrete Repository<T> subclass still gets full type safety at its
 * own call sites via TEntity/TCreateInput.
 */
export class Repository<
  TTable extends SyncableTable,
  TEntity extends Record<string, unknown>,
  TCreateInput extends Record<string, unknown>,
> {
  protected readonly db: SqliteDb;
  protected readonly table: TTable;
  private readonly tableSchema: string;
  private readonly tableName: string;
  private readonly validateCreateInput: (input: TCreateInput) => TCreateInput;
  private readonly getOwnerId: () => string | null;

  constructor(options: RepositoryOptions<TTable, TCreateInput>) {
    this.db = options.db;
    this.table = options.table;
    this.tableSchema = options.tableSchema;
    this.tableName = options.tableName;
    this.validateCreateInput = options.validateCreateInput;
    this.getOwnerId = options.getOwnerId;
  }

  private enqueueSyncOnTx(
    tx: SqliteDb,
    operation: 'insert' | 'update' | 'delete',
    rowId: string,
    payload: Record<string, unknown>,
    basedOnUpdatedAt: string | null,
  ): void {
    tx.insert(syncQueueTable)
      .values({
        id: uuidv4(),
        tableSchema: this.tableSchema,
        tableName: this.tableName,
        rowId,
        operation,
        payload: JSON.stringify(payload),
        basedOnUpdatedAt,
        createdAt: nowIso(),
        attempts: 0,
      })
      .run();
  }

  create(input: TCreateInput): TEntity {
    let validated: TCreateInput;
    try {
      validated = this.validateCreateInput(input);
    } catch (cause) {
      throw new ValidationError('Failed to validate create input', cause);
    }

    const now = nowIso();
    const row = {
      ...validated,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      ownerId: this.getOwnerId(),
      syncStatus: 'pending' as const,
    };

    return this.db.transaction((tx) => {
      tx.insert(this.table)
        .values(row as never)
        .run();
      this.enqueueSyncOnTx(tx as SqliteDb, 'insert', row.id, row, null);
      return row as unknown as TEntity;
    });
  }

  getById(id: string): TEntity | null {
    const idColumn = this.table.id;
    const deletedAtColumn = this.table.deletedAt;
    const rows = this.db
      .select()
      .from(this.table as never)
      .where(and(eq(idColumn, id), isNull(deletedAtColumn)) as SQL)
      .all() as TEntity[];

    return rows[0] ?? null;
  }

  list(): TEntity[] {
    const deletedAtColumn = this.table.deletedAt;
    return this.db
      .select()
      .from(this.table as never)
      .where(isNull(deletedAtColumn))
      .all() as TEntity[];
  }

  update(id: string, patch: Partial<TCreateInput>): TEntity {
    const existing = this.getById(id);
    if (!existing) {
      throw new NotFoundError(`No row with id "${id}" in ${this.tableName}`);
    }

    const basedOnUpdatedAt = String(existing.updatedAt);
    const updatedRow = {
      ...existing,
      ...patch,
      updatedAt: nowIso(),
      syncStatus: 'pending' as const,
    };

    const idColumn = this.table.id;

    return this.db.transaction((tx) => {
      tx.update(this.table)
        .set(updatedRow as never)
        .where(eq(idColumn, id))
        .run();
      this.enqueueSyncOnTx(
        tx as SqliteDb,
        'update',
        id,
        updatedRow,
        basedOnUpdatedAt,
      );
      return updatedRow as unknown as TEntity;
    });
  }

  /**
   * Soft delete — see docs/DATABASE.md's "Soft deletes and tombstones."
   * Never issues a hard DELETE; the row is filtered out of list()/
   * getById() via the deletedAt check above.
   */
  delete(id: string): void {
    const existing = this.getById(id);
    if (!existing) {
      throw new NotFoundError(`No row with id "${id}" in ${this.tableName}`);
    }

    const basedOnUpdatedAt = String(existing.updatedAt);
    const now = nowIso();
    const tombstone = {
      ...existing,
      deletedAt: now,
      updatedAt: now,
      syncStatus: 'pending' as const,
    };
    const idColumn = this.table.id;

    this.db.transaction((tx) => {
      tx.update(this.table)
        .set({ deletedAt: now, updatedAt: now, syncStatus: 'pending' } as never)
        .where(eq(idColumn, id))
        .run();
      this.enqueueSyncOnTx(
        tx as SqliteDb,
        'delete',
        id,
        tombstone,
        basedOnUpdatedAt,
      );
    });
  }
}
