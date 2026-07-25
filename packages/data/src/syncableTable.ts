import type { Column, ColumnBaseConfig, ColumnDataType } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';

type AnyColumn = Column<
  ColumnBaseConfig<ColumnDataType, string>,
  object,
  object
>;

/**
 * The shape every syncable SQLite table must expose, per
 * docs/DATABASE.md's common-column convention. Repository<T> is generic
 * over any table satisfying this — it never knows a concrete entity's
 * name or domain-specific columns.
 */
export type SyncableTable = SQLiteTable & {
  id: AnyColumn;
  createdAt: AnyColumn;
  updatedAt: AnyColumn;
  deletedAt: AnyColumn;
  ownerId: AnyColumn;
  syncStatus: AnyColumn;
};
