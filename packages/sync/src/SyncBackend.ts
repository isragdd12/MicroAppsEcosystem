/**
 * What the sync engine needs from a remote backend to push/pull one
 * table — see docs/SYNC_ENGINE.md. Deliberately backend-agnostic: a real
 * Supabase-backed implementation lives at the app layer (wraps
 * PostgREST/RPC calls), while tests use a simple in-memory fake. The
 * engine itself never imports a Supabase client.
 */
export interface RemoteRow {
  id: string;
  updatedAt: string;
  deletedAt: string | null;
  [key: string]: unknown;
}

export interface PushResult {
  /** The server-authoritative updatedAt assigned to the pushed row (see
   * docs/SYNC_ENGINE.md: "stamped by Postgres, not by the client"). */
  serverUpdatedAt: string;
  /** True if the push was rejected because a newer remote version already
   * exists — the caller must not apply its local write as a win. */
  conflict: boolean;
  /** The current remote row, present when conflict is true, so the
   * caller can adopt the winning remote version locally. */
  remoteRow?: RemoteRow;
}

export interface SyncBackend {
  /**
   * Attempts to push one row. Must implement the server-timestamp
   * tiebreaker described in docs/SYNC_ENGINE.md: if the row was already
   * updated remotely with a timestamp later than `basedOnUpdatedAt`, the
   * push is rejected as a conflict rather than silently overwritten.
   */
  push(params: {
    tableSchema: string;
    tableName: string;
    operation: 'insert' | 'update' | 'delete';
    row: RemoteRow;
    /** The updatedAt this write was based on (undefined for a fresh insert). */
    basedOnUpdatedAt?: string;
  }): Promise<PushResult>;

  /** Rows changed remotely since `sinceUpdatedAt` (exclusive), for one table. */
  pull(params: {
    tableSchema: string;
    tableName: string;
    sinceUpdatedAt: string | null;
  }): Promise<RemoteRow[]>;
}
