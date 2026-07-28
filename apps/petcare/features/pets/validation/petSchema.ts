import { z } from 'zod';

export const createPetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  species: z.string().min(1, 'Species is required').max(50),
  breed: z.string().max(100).optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')
    .optional(),
  photoUrl: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
});

export type CreatePetInput = z.infer<typeof createPetSchema>;
