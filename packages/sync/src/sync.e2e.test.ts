import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import {
  drizzle,
  type BetterSQLite3Database,
} from 'drizzle-orm/better-sqlite3';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createConsoleLogger } from '@microapps/logger';

import { pullRemoteChanges } from './pullRemoteChanges';
import { pushOutbox } from './pushOutbox';
import { InMemorySyncBackend } from './testFakes/InMemorySyncBackend';

// Fixture entity — a generic "widget" table with no relation to any real
// app, per docs/ROADMAP.md's Milestone 2 exit criteria.
const widgetsTable = sqliteTable('widgets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  ownerId: text('owner_id'),
  syncStatus: text('sync_status').notNull(),
});

const TABLE_SCHEMA = 'fixtures';
const TABLE_NAME = 'widgets';

function createDevice(): BetterSQLite3Database {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite);
  db.run(sql`
    create table widgets (
      id text primary key,
      name text not null,
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

function readWidget(db: BetterSQLite3Database, id: string) {
  return db
    .select()
    .from(widgetsTable)
    .all()
    .find((row) => row.id === id);
}

/** Simulates what Repository.create() does: insert the row + enqueue an
 * outbox entry in one step, for a fresh (never-synced) fixture row. */
function createLocalWidget(
  db: BetterSQLite3Database,
  row: { id: string; name: string; updatedAt: string },
) {
  db.insert(widgetsTable)
    .values({
      id: row.id,
      name: row.name,
      createdAt: row.updatedAt,
      updatedAt: row.updatedAt,
      deletedAt: null,
      ownerId: null,
      syncStatus: 'pending',
    })
    .run();

  db.run(sql`
    insert into sync_queue (id, table_schema, table_name, row_id, operation, payload, based_on_updated_at, created_at, attempts)
    values (
      ${`queue-${row.id}-insert`}, ${TABLE_SCHEMA}, ${TABLE_NAME}, ${row.id}, 'insert',
      ${JSON.stringify({ id: row.id, name: row.name, updatedAt: row.updatedAt, deletedAt: null })},
      ${null}, ${row.updatedAt}, 0
    )
  `);
}

/** Simulates what Repository.update() does: bump the row + enqueue an
 * outbox entry recording basedOnUpdatedAt = the row's pre-edit updatedAt. */
function editLocalWidget(
  db: BetterSQLite3Database,
  id: string,
  newName: string,
  newUpdatedAt: string,
) {
  const existing = readWidget(db, id)!;
  const basedOnUpdatedAt = existing.updatedAt;

  db.update(widgetsTable)
    .set({ name: newName, updatedAt: newUpdatedAt, syncStatus: 'pending' })
    .run();

  db.run(sql`
    insert into sync_queue (id, table_schema, table_name, row_id, operation, payload, based_on_updated_at, created_at, attempts)
    values (
      ${`queue-${id}-${newUpdatedAt}`}, ${TABLE_SCHEMA}, ${TABLE_NAME}, ${id}, 'update',
      ${JSON.stringify({ id, name: newName, updatedAt: newUpdatedAt, deletedAt: null })},
      ${basedOnUpdatedAt}, ${newUpdatedAt}, 0
    )
  `);
}

function upsertLocalFromRemote(
  db: BetterSQLite3Database,
  row: {
    id: string;
    name?: unknown;
    updatedAt: string;
    deletedAt: string | null;
  },
) {
  const existing = readWidget(db, row.id);
  if (existing) {
    db.update(widgetsTable)
      .set({
        name: String(row.name ?? existing.name),
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
        syncStatus: 'synced',
      })
      .run();
  } else {
    db.insert(widgetsTable)
      .values({
        id: row.id,
        name: String(row.name ?? ''),
        createdAt: row.updatedAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
        ownerId: null,
        syncStatus: 'synced',
      })
      .run();
  }
}

function silentLogger() {
  const logger = createConsoleLogger();
  jest.spyOn(logger, 'warn').mockImplementation(() => {});
  jest.spyOn(logger, 'info').mockImplementation(() => {});
  jest.spyOn(logger, 'error').mockImplementation(() => {});
  return logger;
}

describe('sync engine end-to-end (fixture entity, two simulated devices)', () => {
  it('creates a row on device A, pushes it, and pulls it down on device B', async () => {
    const backend = new InMemorySyncBackend();
    const logger = silentLogger();

    const deviceA = createDevice();
    const deviceB = createDevice();

    createLocalWidget(deviceA, {
      id: 'widget-1',
      name: 'Gadget',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });

    const pushResult = await pushOutbox({
      db: deviceA,
      backend,
      logger,
      applyServerConfirmation: ({ serverUpdatedAt }) => {
        deviceA
          .update(widgetsTable)
          .set({ updatedAt: serverUpdatedAt, syncStatus: 'synced' })
          .run();
      },
    });
    expect(pushResult).toEqual({ pushed: 1, conflicted: 0, failed: 0 });

    const pullResult = await pullRemoteChanges({
      db: deviceB,
      backend,
      logger,
      tableSchema: TABLE_SCHEMA,
      tableName: TABLE_NAME,
      sinceUpdatedAt: null,
      applyRemoteRow: (row) => upsertLocalFromRemote(deviceB, row as never),
    });

    expect(pullResult.applied).toBe(1);
    expect(readWidget(deviceB, 'widget-1')).toMatchObject({
      name: 'Gadget',
      syncStatus: 'synced',
    });
  });

  it('resolves a conflicting edit via last-write-wins on the server timestamp', async () => {
    const backend = new InMemorySyncBackend();
    const logger = silentLogger();

    const deviceA = createDevice();
    const deviceB = createDevice();

    // Both devices start from the same synced state.
    createLocalWidget(deviceA, {
      id: 'widget-2',
      name: 'Original',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });
    await pushOutbox({
      db: deviceA,
      backend,
      logger,
      applyServerConfirmation: ({ serverUpdatedAt }) => {
        deviceA
          .update(widgetsTable)
          .set({ updatedAt: serverUpdatedAt, syncStatus: 'synced' })
          .run();
      },
    });

    await pullRemoteChanges({
      db: deviceB,
      backend,
      logger,
      tableSchema: TABLE_SCHEMA,
      tableName: TABLE_NAME,
      sinceUpdatedAt: null,
      applyRemoteRow: (row) => upsertLocalFromRemote(deviceB, row as never),
    });
    expect(readWidget(deviceB, 'widget-2')).toMatchObject({ name: 'Original' });

    // Device A edits and pushes first — this becomes the server's
    // winning version, based on the synced updatedAt both devices share.
    editLocalWidget(
      deviceA,
      'widget-2',
      'Edited by A',
      '2025-01-02T00:00:00.000Z',
    );
    const pushA = await pushOutbox({
      db: deviceA,
      backend,
      logger,
      applyServerConfirmation: ({ serverUpdatedAt }) => {
        deviceA
          .update(widgetsTable)
          .set({ updatedAt: serverUpdatedAt, syncStatus: 'synced' })
          .run();
      },
    });
    expect(pushA).toEqual({ pushed: 1, conflicted: 0, failed: 0 });

    // Device B edits the SAME row based on the same original synced
    // updatedAt (it hasn't pulled A's edit yet) — its push must be
    // rejected as a conflict, and A's edit must be the one that wins.
    editLocalWidget(
      deviceB,
      'widget-2',
      'Edited by B',
      '2025-01-02T00:00:01.000Z',
    );

    let conflictRemoteRow: unknown;
    const pushB = await pushOutbox({
      db: deviceB,
      backend,
      logger,
      applyServerConfirmation: ({ status, remoteRow }) => {
        if (status === 'conflict' && remoteRow) {
          conflictRemoteRow = remoteRow;
          upsertLocalFromRemote(deviceB, remoteRow as never);
        }
      },
    });

    expect(pushB.pushed).toBe(0);
    expect(pushB.conflicted).toBe(1);
    expect(conflictRemoteRow).toMatchObject({ name: 'Edited by A' });

    // Device B's local state must now reflect A's winning edit, not B's
    // discarded one — the actual "conflict resolves correctly" assertion.
    expect(readWidget(deviceB, 'widget-2')).toMatchObject({
      name: 'Edited by A',
      syncStatus: 'synced',
    });
  });
});
