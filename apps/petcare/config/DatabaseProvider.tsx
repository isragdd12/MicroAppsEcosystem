import { runMigrations } from '@microapps/data';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import { petMigrations } from '../features/pets/db/migrations';
import { feedingMigrations } from '../features/feeding/db/migrations';

export type AppDb = BaseSQLiteDatabase<'sync', unknown>;

const DatabaseContext = createContext<AppDb | null>(null);

const ALL_MIGRATIONS = [...petMigrations, ...feedingMigrations];

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<AppDb | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // expo-sqlite is native-only; skip on web — features requiring DB won't render
      return;
    }
    void (async () => {
      const { drizzle } = await import('drizzle-orm/expo-sqlite');
      const SQLite = await import('expo-sqlite');
      const expo = SQLite.openDatabaseSync('petcare.db');
      const database = drizzle(expo) as unknown as AppDb;
      runMigrations(database, ALL_MIGRATIONS);
      setDb(database);
    })();
  }, []);

  // On web render children without DB — screens that call useDb() will throw,
  // but we gate those behind native-only routes / Platform checks
  if (Platform.OS === 'web') {
    return (
      <DatabaseContext.Provider value={null}>
        {children}
      </DatabaseContext.Provider>
    );
  }

  if (!db) return null;

  return (
    <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>
  );
}

export function useDb(): AppDb | null {
  return useContext(DatabaseContext);
}
