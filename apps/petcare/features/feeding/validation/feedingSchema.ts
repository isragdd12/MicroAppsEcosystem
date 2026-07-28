import { z } from 'zod';

export const createFeedingSchema = z.object({
  petId: z.string().uuid(),
  foodType: z.string().min(1, 'Food type is required').max(100),
  amountGrams: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
  fedAt: z.string().datetime({ offset: true }),
});

export type CreateFeedingInput = z.infer<typeof createFeedingSchema>;
