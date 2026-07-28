import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

export const feedingTable = sqliteTable('feedings', {
  id: text('id').primaryKey(),
  petId: text('pet_id').notNull(),
  foodType: text('food_type').notNull(),
  amountGrams: real('amount_grams'),
  notes: text('notes'),
  fedAt: text('fed_at').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  ownerId: text('owner_id'),
  syncStatus: text('sync_status', { enum: ['pending', 'synced'] })
    .notNull()
    .default('pending'),
});

export type FeedingRow = typeof feedingTable.$inferSelect;
