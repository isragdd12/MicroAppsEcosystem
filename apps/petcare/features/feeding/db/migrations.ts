import type { Migration } from '@microapps/data';
import { sql } from 'drizzle-orm';

export const feedingMigrations: Migration[] = [
  {
    id: '002_create_feedings',
    up: (db) => {
      db.run(sql`
        CREATE TABLE IF NOT EXISTS feedings (
          id TEXT PRIMARY KEY,
          pet_id TEXT NOT NULL,
          food_type TEXT NOT NULL,
          amount_grams REAL,
          notes TEXT,
          fed_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          owner_id TEXT,
          sync_status TEXT NOT NULL DEFAULT 'pending'
        )
      `);
      db.run(
        sql`CREATE INDEX IF NOT EXISTS feedings_pet_id ON feedings(pet_id)`,
      );
      db.run(
        sql`CREATE INDEX IF NOT EXISTS feedings_fed_at ON feedings(fed_at)`,
      );
    },
  },
];
