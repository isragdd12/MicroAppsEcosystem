import { sql } from 'drizzle-orm';

import type { SqliteDb } from './Repository';

export interface Migration {
  /** Sortable identifier, e.g. "20260101000000_create_pets". */
  id: string;
  up: (db: SqliteDb) => void;
}

/**
 * Applies any migrations not yet recorded in the local __migrations
 * table, in id order, each inside its own transaction — see
 * docs/SQLITE.md's "Migrations" section. A feature's schema/migrations
 * live with that feature (apps/<app>/features/<feature>/db/migrations),
 * but the runner itself is generic platform infrastructure.
 */
export function runMigrations(
  db: SqliteDb,
  migrations: Migration[],
): { applied: string[] } {
  db.run(sql`
    create table if not exists __migrations (
      id text primary key,
      applied_at text not null
    )
  `);

  const appliedRows = db.all(sql`select id from __migrations`) as {
    id: string;
  }[];
  const alreadyApplied = new Set(appliedRows.map((row) => row.id));

  const pending = [...migrations]
    .sort((a, b) => a.id.localeCompare(b.id))
    .filter((migration) => !alreadyApplied.has(migration.id));

  const applied: string[] = [];

  for (const migration of pending) {
    db.transaction((tx) => {
      migration.up(tx as SqliteDb);
      tx.run(
        sql`insert into __migrations (id, applied_at) values (${migration.id}, ${new Date().toISOString()})`,
      );
    });
    applied.push(migration.id);
  }

  return { applied };
}
