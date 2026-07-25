import { and, eq } from 'drizzle-orm';
import { syncQueueTable, type SqliteDb } from '@microapps/data';
import type { Logger } from '@microapps/logger';

import type { RemoteRow, SyncBackend } from './SyncBackend';

export interface PullRemoteChangesOptions {
  db: SqliteDb;
  backend: SyncBackend;
  logger: Logger;
  tableSchema: string;
  tableName: string;
  /** Cursor: the latest updatedAt already pulled for this table, or null
   * for a first-ever pull (see docs/SYNC_ENGINE.md's "Pull path"). */
  sinceUpdatedAt: string | null;
  /** Applies a pulled remote row onto the local domain table — provided
   * by the caller, since only it knows the concrete table shape. */
  applyRemoteRow: (row: RemoteRow) => void;
}

export interface PullRemoteChangesResult {
  applied: number;
  skippedDueToPendingLocalEdit: number;
  latestUpdatedAt: string | null;
}

/**
 * Pulls rows changed remotely since the cursor and applies them locally
 * — see docs/SYNC_ENGINE.md's "Pull path". A row with a pending local
 * outbox entry (an unpushed local edit) is skipped rather than
 * overwritten; the next push cycle resolves that conflict via
 * last-write-wins against the server's timestamp instead.
 */
export async function pullRemoteChanges(
  options: PullRemoteChangesOptions,
): Promise<PullRemoteChangesResult> {
  const {
    db,
    backend,
    logger,
    tableSchema,
    tableName,
    sinceUpdatedAt,
    applyRemoteRow,
  } = options;

  const remoteRows = await backend.pull({
    tableSchema,
    tableName,
    sinceUpdatedAt,
  });

  let applied = 0;
  let skippedDueToPendingLocalEdit = 0;
  let latestUpdatedAt = sinceUpdatedAt;

  for (const row of remoteRows) {
    const pendingLocalEdit = db
      .select()
      .from(syncQueueTable)
      .where(
        and(
          eq(syncQueueTable.tableSchema, tableSchema),
          eq(syncQueueTable.tableName, tableName),
          eq(syncQueueTable.rowId, row.id),
        ),
      )
      .all();

    if (pendingLocalEdit.length > 0) {
      skippedDueToPendingLocalEdit += 1;
      logger.info('Skipping pulled row with a pending local edit', {
        tableSchema,
        tableName,
        rowId: row.id,
      });
      continue;
    }

    applyRemoteRow(row);
    applied += 1;

    if (latestUpdatedAt === null || row.updatedAt > latestUpdatedAt) {
      latestUpdatedAt = row.updatedAt;
    }
  }

  return { applied, skippedDueToPendingLocalEdit, latestUpdatedAt };
}
