import { asc, eq } from 'drizzle-orm';
import { syncQueueTable, type SqliteDb } from '@microapps/data';
import type { Logger } from '@microapps/logger';

import type { RemoteRow, SyncBackend } from './SyncBackend';

export interface PushOutboxOptions {
  db: SqliteDb;
  backend: SyncBackend;
  logger: Logger;
  /** Applies a server-confirmed row's updatedAt/syncStatus back onto the
   * local domain table — provided by the caller since only it knows the
   * concrete table for a given tableName (the outbox itself is generic). */
  applyServerConfirmation: (params: {
    tableSchema: string;
    tableName: string;
    rowId: string;
    serverUpdatedAt: string;
    status: 'synced' | 'conflict';
    remoteRow?: RemoteRow;
  }) => void;
  /** Max attempts before a queue entry is abandoned rather than retried
   * forever — see docs/SYNC_ENGINE.md's "Failure handling". */
  maxAttempts?: number;
}

export interface PushOutboxResult {
  pushed: number;
  conflicted: number;
  failed: number;
}

/**
 * Drains the local outbox (sync_queue) in created_at order, pushing each
 * entry to the backend — see docs/SYNC_ENGINE.md's "The outbox (push
 * path)". A push failure (network/server error) leaves the entry queued
 * for retry with an incremented attempt count; it is never surfaced as a
 * blocking error to the caller (see docs/ERROR_HANDLING.md's "Sync
 * errors specifically").
 */
export async function pushOutbox(
  options: PushOutboxOptions,
): Promise<PushOutboxResult> {
  const {
    db,
    backend,
    logger,
    applyServerConfirmation,
    maxAttempts = 5,
  } = options;

  const queued = db
    .select()
    .from(syncQueueTable)
    .orderBy(asc(syncQueueTable.createdAt))
    .all();

  let pushed = 0;
  let conflicted = 0;
  let failed = 0;

  for (const entry of queued) {
    const payload = JSON.parse(entry.payload) as Record<string, unknown>;
    const remoteRow: RemoteRow = {
      id: entry.rowId,
      updatedAt: String(payload.updatedAt),
      deletedAt: (payload.deletedAt as string | null) ?? null,
      ...payload,
    };

    try {
      const result = await backend.push({
        tableSchema: entry.tableSchema,
        tableName: entry.tableName,
        operation: entry.operation,
        row: remoteRow,
        basedOnUpdatedAt: entry.basedOnUpdatedAt ?? undefined,
      });

      if (result.conflict) {
        conflicted += 1;
        applyServerConfirmation({
          tableSchema: entry.tableSchema,
          tableName: entry.tableName,
          rowId: entry.rowId,
          serverUpdatedAt: result.serverUpdatedAt,
          status: 'conflict',
          remoteRow: result.remoteRow,
        });
        logger.warn(
          'Sync push conflict — remote version wins (last-write-wins)',
          {
            tableSchema: entry.tableSchema,
            tableName: entry.tableName,
            rowId: entry.rowId,
          },
        );
      } else {
        pushed += 1;
        applyServerConfirmation({
          tableSchema: entry.tableSchema,
          tableName: entry.tableName,
          rowId: entry.rowId,
          serverUpdatedAt: result.serverUpdatedAt,
          status: 'synced',
        });
      }

      db.delete(syncQueueTable).where(eq(syncQueueTable.id, entry.id)).run();
    } catch (cause) {
      failed += 1;
      const attempts = entry.attempts + 1;

      if (attempts >= maxAttempts) {
        logger.error(cause, {
          message: 'Sync push exhausted retries — abandoning queue entry',
          tableSchema: entry.tableSchema,
          tableName: entry.tableName,
          rowId: entry.rowId,
          attempts,
        });
        db.delete(syncQueueTable).where(eq(syncQueueTable.id, entry.id)).run();
      } else {
        logger.warn('Sync push failed, will retry', {
          tableSchema: entry.tableSchema,
          tableName: entry.tableName,
          rowId: entry.rowId,
          attempts,
        });
        db.update(syncQueueTable)
          .set({ attempts })
          .where(eq(syncQueueTable.id, entry.id))
          .run();
      }
    }
  }

  return { pushed, conflicted, failed };
}
