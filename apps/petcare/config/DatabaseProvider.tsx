import { runMigrations } from '@microapps/data';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import { petMigrations } from '../features/pets/db/migrations';
import { feedingMigrations } from '../features/feeding/db/migrations';

export type AppDb = BaseSQLiteDatabase<'sync', unknown>;

const DatabaseContext = createContext<AppDb | null>(null);

const ALL_MIGRATIONS = [...petMigrations, ...feedingMigrations];

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<AppDb | null>(null);

  useEffect(() => {
    const expo = SQLite.openDatabaseSync('petcare.db');
    const database = drizzle(expo) as unknown as AppDb;
    runMigrations(database, ALL_MIGRATIONS);
    setDb(database);
  }, []);

  if (!db) return null;

  return (
    <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>
  );
}

export function useDb(): AppDb {
  const db = useContext(DatabaseContext);
  if (!db) throw new Error('useDb must be used within a DatabaseProvider');
  return db;
}
