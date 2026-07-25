import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * The outbox — see docs/SYNC_ENGINE.md. Every mutating Repository call
 * appends a row here in the same transaction as the domain write. The
 * sync engine (packages/sync) only ever reads this table; it never
 * scans domain tables directly.
 */
export const syncQueueTable = sqliteTable('sync_queue', {
  id: text('id').primaryKey(),
  tableSchema: text('table_schema').notNull(),
  tableName: text('table_name').notNull(),
  rowId: text('row_id').notNull(),
  operation: text('operation', {
    enum: ['insert', 'update', 'delete'],
  }).notNull(),
  payload: text('payload').notNull(),
  /**
   * The row's updatedAt at the moment this local edit was MADE (i.e. the
   * last-known-synced value it was based on) — captured at enqueue time,
   * not derived from the payload's new updatedAt. This is what the sync
   * engine compares against the server's current value to detect a
   * conflict (docs/SYNC_ENGINE.md's last-write-wins tiebreaker). Null for
   * a fresh insert, which can never conflict.
   */
  basedOnUpdatedAt: text('based_on_updated_at'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  attempts: integer('attempts').notNull().default(0),
});

export type SyncQueueRow = typeof syncQueueTable.$inferSelect;
export type NewSyncQueueRow = typeof syncQueueTable.$inferInsert;
