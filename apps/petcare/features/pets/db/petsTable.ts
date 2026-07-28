import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const petsTable = sqliteTable('pets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  species: text('species').notNull(),
  breed: text('breed'),
  birthDate: text('birth_date'),
  photoUrl: text('photo_url'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  ownerId: text('owner_id'),
  syncStatus: text('sync_status', { enum: ['pending', 'synced'] })
    .notNull()
    .default('pending'),
});

export type PetRow = typeof petsTable.$inferSelect;
