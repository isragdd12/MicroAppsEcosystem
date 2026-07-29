import { z } from 'zod';

export const createPetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  species: z.string().min(1, 'Species is required').max(50),
  breed: z.string().max(100).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format').optional(),
  photoUrl: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
});

export type CreatePetInput = z.infer<typeof createPetSchema>;

export const createFeedingSchema = z.object({
  petId: z.string().uuid(),
  foodType: z.string().min(1, 'Food type is required').max(100),
  amountGrams: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
  fedAt: z.string().datetime({ offset: true }),
});

export type CreateFeedingInput = z.infer<typeof createFeedingSchema>;

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birthDate: string | null;
  photoUrl: string | null;
  notes: string | null;
  ownerId: string | null;
  syncStatus: 'synced' | 'pending' | 'conflict';
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Feeding {
  id: string;
  petId: string;
  foodType: string;
  amountGrams: number | null;
  notes: string | null;
  fedAt: string;
  ownerId: string | null;
  syncStatus: 'synced' | 'pending' | 'conflict';
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PetWeight {
  id: string;
  petId: string;
  weightKg: number;
  measuredAt: string;
  notes: string | null;
  ownerId: string | null;
  createdAt: string;
}

export interface HealthRecord {
  id: string;
  petId: string;
  recordType: 'vet_visit' | 'vaccination' | 'medication' | 'note';
  title: string;
  description: string | null;
  recordDate: string;
  vetName: string | null;
  ownerId: string | null;
  createdAt: string;
}
