import { z } from 'zod';

/**
 * The common columns every syncable entity has, per docs/DATABASE.md —
 * shared across SQLite and its Postgres mirror. Feature schemas extend
 * this rather than redeclaring these fields per entity.
 */
export const syncableEntityBaseSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
  ownerId: z.string().uuid().nullable(),
  syncStatus: z.enum(['synced', 'pending', 'conflict']),
});

export type SyncableEntityBase = z.infer<typeof syncableEntityBaseSchema>;

/**
 * Builds a "create input" schema for an entity from just its
 * domain-specific fields — the caller never repeats id/timestamp/owner/
 * syncStatus fields, since those are managed by the repository layer
 * (see docs/DATABASE.md) and never supplied when creating a record. This
 * is the single source of truth for "what must I pass to create one,"
 * shared by forms and repositories (see docs/STATE_MANAGEMENT.md).
 *
 * Usage:
 *   const petSchema = syncableEntityBaseSchema.extend({ name: z.string(), species: z.string() });
 *   const createPetSchema = createInputSchema({ name: z.string(), species: z.string() });
 */
export function createInputSchema<Shape extends z.ZodRawShape>(
  domainFields: Shape,
) {
  return z.object(domainFields);
}
