import Database from 'better-sqlite3';
import {
  drizzle,
  type BetterSQLite3Database,
} from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { NotFoundError, Repository, ValidationError } from './Repository';
import { syncQueueTable } from './syncQueueTable';
import { runMigrations } from './migrationRunner';

// Fixture entity, standing in for a real domain table — see
// docs/ROADMAP.md's Milestone 2 exit criteria ("a fixture entity can be
// created locally..."). Deliberately has no relation to any real app.
const widgetsTable = sqliteTable('widgets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  count: text('count').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  ownerId: text('owner_id'),
  syncStatus: text('sync_status').notNull(),
});

interface Widget extends Record<string, unknown> {
  id: string;
  name: string;
  count: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  ownerId: string | null;
  syncStatus: string;
}

interface CreateWidgetInput extends Record<string, unknown> {
  name: string;
  count: string;
}

function createTestDb(): BetterSQLite3Database {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite);
  db.run(sql`
    create table widgets (
      id text primary key,
      name text not null,
      count text not null,
      created_at text not null,
      updated_at text not null,
      deleted_at text,
      owner_id text,
      sync_status text not null
    )
  `);
  db.run(sql`
    create table sync_queue (
      id text primary key,
      table_schema text not null,
      table_name text not null,
      row_id text not null,
      operation text not null,
      payload text not null,
      based_on_updated_at text,
      created_at text not null,
      attempts integer not null default 0
    )
  `);
  return db;
}

function createTestRepository(
  db: BetterSQLite3Database,
  ownerId: string | null = null,
) {
  return new Repository<typeof widgetsTable, Widget, CreateWidgetInput>({
    db,
    table: widgetsTable,
    tableSchema: 'fixtures',
    tableName: 'widgets',
    getOwnerId: () => ownerId,
    validateCreateInput: (input) => {
      if (!input.name.trim()) {
        throw new Error('name is required');
      }
      return input;
    },
  });
}

describe('Repository (fixture entity)', () => {
  let db: BetterSQLite3Database;
  let repo: Repository<typeof widgetsTable, Widget, CreateWidgetInput>;

  beforeEach(() => {
    db = createTestDb();
    repo = createTestRepository(db);
  });

  it('create() persists the row and returns it with generated id/timestamps', () => {
    const widget = repo.create({ name: 'Gadget', count: '1' });

    expect(widget.id).toBeTruthy();
    expect(widget.name).toBe('Gadget');
    expect(widget.syncStatus).toBe('pending');
    expect(widget.deletedAt).toBeNull();

    const fetched = repo.getById(widget.id);
    expect(fetched).toEqual(widget);
  });

  it('create() rejects invalid input via validateCreateInput', () => {
    expect(() => repo.create({ name: '', count: '1' })).toThrow(
      ValidationError,
    );
  });

  it('create() enqueues a sync_queue row in the same transaction as the domain write', () => {
    const widget = repo.create({ name: 'Gadget', count: '1' });

    const queued = db.select().from(syncQueueTable).all();
    expect(queued).toHaveLength(1);
    expect(queued[0]).toMatchObject({
      operation: 'insert',
      rowId: widget.id,
      tableSchema: 'fixtures',
      tableName: 'widgets',
    });
    expect(JSON.parse(queued[0]!.payload)).toMatchObject({ name: 'Gadget' });
  });

  it('update() modifies the row, bumps updatedAt, and enqueues an update op', () => {
    const widget = repo.create({ name: 'Gadget', count: '1' });
    const updated = repo.update(widget.id, { count: '2' });

    expect(updated.count).toBe('2');
    expect(updated.name).toBe('Gadget');

    const queued = db.select().from(syncQueueTable).all();
    expect(queued.map((q) => q.operation)).toEqual(['insert', 'update']);

    // The update's basedOnUpdatedAt must record the row's PRE-edit
    // updatedAt (widget.updatedAt), not the new one — this is what the
    // sync engine's last-write-wins conflict check compares against
    // (see packages/sync's SYNC_ENGINE.md-derived design).
    const updateEntry = queued.find((q) => q.operation === 'update');
    expect(updateEntry?.basedOnUpdatedAt).toBe(widget.updatedAt);
    expect(updateEntry?.basedOnUpdatedAt).not.toBe(updated.updatedAt);
  });

  it('update() throws NotFoundError for a missing id', () => {
    expect(() => repo.update('missing-id', { count: '9' })).toThrow(
      NotFoundError,
    );
  });

  it('delete() soft-deletes (sets deletedAt) rather than removing the row', () => {
    const widget = repo.create({ name: 'Gadget', count: '1' });
    repo.delete(widget.id);

    const rawRow = db
      .select()
      .from(widgetsTable)
      .all()
      .find((row) => row.id === widget.id);
    expect(rawRow?.deletedAt).toBeTruthy();

    // Soft-deleted rows are filtered out of normal reads.
    expect(repo.getById(widget.id)).toBeNull();
  });

  it('list() excludes soft-deleted rows', () => {
    const a = repo.create({ name: 'A', count: '1' });
    const b = repo.create({ name: 'B', count: '1' });
    repo.delete(a.id);

    const remaining = repo.list();
    expect(remaining.map((w) => w.id)).toEqual([b.id]);
  });

  it('create() stamps ownerId from getOwnerId(), null when anonymous', () => {
    const anonymousWidget = repo.create({ name: 'Gadget', count: '1' });
    expect(anonymousWidget.ownerId).toBeNull();

    const signedInRepo = createTestRepository(db, 'user-123');
    const ownedWidget = signedInRepo.create({ name: 'Gadget', count: '1' });
    expect(ownedWidget.ownerId).toBe('user-123');
  });
});

describe('runMigrations', () => {
  it('applies pending migrations in id order and records them, skipping already-applied ones', () => {
    const sqlite = new Database(':memory:');
    const db = drizzle(sqlite);

    const calls: string[] = [];
    const migrations = [
      {
        id: '20260102_second',
        up: () => calls.push('second'),
      },
      {
        id: '20260101_first',
        up: () => calls.push('first'),
      },
    ];

    const firstRun = runMigrations(db, migrations);
    expect(firstRun.applied).toEqual(['20260101_first', '20260102_second']);
    expect(calls).toEqual(['first', 'second']);

    const secondRun = runMigrations(db, migrations);
    expect(secondRun.applied).toEqual([]);
    expect(calls).toEqual(['first', 'second']);
  });
});
