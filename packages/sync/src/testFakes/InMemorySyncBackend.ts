import type { PushResult, RemoteRow, SyncBackend } from '../SyncBackend';

/**
 * A shared "remote" for tests — stands in for Supabase/Postgres. Two
 * Repository/SqliteDb instances pushing/pulling against the SAME
 * InMemorySyncBackend instance simulate two devices syncing through one
 * real backend, per docs/ROADMAP.md's Milestone 2 exit criteria ("a
 * second local DB instance in a test").
 */
export class InMemorySyncBackend implements SyncBackend {
  private rowsByTable = new Map<string, Map<string, RemoteRow>>();
  private clock = 0;

  private key(tableSchema: string, tableName: string): string {
    return `${tableSchema}.${tableName}`;
  }

  /** Monotonic, sortable "server time" — stands in for Postgres's now(). */
  private nextServerTimestamp(): string {
    this.clock += 1;
    return `2026-01-01T00:00:${String(this.clock).padStart(2, '0')}.000Z`;
  }

  async push(params: {
    tableSchema: string;
    tableName: string;
    operation: 'insert' | 'update' | 'delete';
    row: RemoteRow;
    basedOnUpdatedAt?: string;
  }): Promise<PushResult> {
    const tableKey = this.key(params.tableSchema, params.tableName);
    const table =
      this.rowsByTable.get(tableKey) ?? new Map<string, RemoteRow>();
    this.rowsByTable.set(tableKey, table);

    const existing = table.get(params.row.id);

    // Mirrors docs/SYNC_ENGINE.md: if the remote row was already updated
    // with a timestamp later than what this push was based on, reject as
    // a conflict rather than overwrite — the remote version wins.
    if (
      existing &&
      params.basedOnUpdatedAt !== undefined &&
      existing.updatedAt > params.basedOnUpdatedAt
    ) {
      return {
        serverUpdatedAt: existing.updatedAt,
        conflict: true,
        remoteRow: existing,
      };
    }

    const serverUpdatedAt = this.nextServerTimestamp();
    const stored: RemoteRow = { ...params.row, updatedAt: serverUpdatedAt };
    table.set(params.row.id, stored);

    return { serverUpdatedAt, conflict: false };
  }

  async pull(params: {
    tableSchema: string;
    tableName: string;
    sinceUpdatedAt: string | null;
  }): Promise<RemoteRow[]> {
    const tableKey = this.key(params.tableSchema, params.tableName);
    const table =
      this.rowsByTable.get(tableKey) ?? new Map<string, RemoteRow>();

    return [...table.values()]
      .filter(
        (row) =>
          params.sinceUpdatedAt === null ||
          row.updatedAt > params.sinceUpdatedAt,
      )
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  }
}
