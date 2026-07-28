import type { Migration } from '@microapps/data';
import { sql } from 'drizzle-orm';

export const petMigrations: Migration[] = [
  {
    id: '001_create_pets',
    up: (db) => {
      db.run(sql`
        CREATE TABLE IF NOT EXISTS pets (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          species TEXT NOT NULL,
          breed TEXT,
          birth_date TEXT,
          photo_url TEXT,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          owner_id TEXT,
          sync_status TEXT NOT NULL DEFAULT 'pending'
        )
      `);
    },
  },
];
