import { v4 as uuidv4 } from 'uuid';

import { supabase } from '../../../config/supabase';
import {
  createFeedingSchema,
  type CreateFeedingInput,
} from '../validation/feedingSchema';

import type { Feeding } from './FeedingRepository';

// Queries the public-schema view (petcare_feedings) which mirrors
// petcare.feedings with RLS enforced via security_invoker.
const TABLE = 'petcare_feedings';

export class SupabaseFeedingRepository {
  constructor(private readonly ownerId: string | null) {}

  async list(): Promise<Feeding[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .is('deleted_at', null)
      .order('fed_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToFeeding);
  }

  async listForPet(petId: string): Promise<Feeding[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('pet_id', petId)
      .is('deleted_at', null)
      .order('fed_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToFeeding);
  }

  async create(input: CreateFeedingInput): Promise<Feeding> {
    const validated = createFeedingSchema.parse(input);
    const now = new Date().toISOString();
    const row = {
      id: uuidv4(),
      pet_id: validated.petId,
      food_type: validated.foodType,
      amount_grams: validated.amountGrams ?? null,
      notes: validated.notes ?? null,
      fed_at: validated.fedAt,
      owner_id: this.ownerId,
      sync_status: 'synced',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    // Views don't expose a PK to PostgREST; .select() after .insert() → 400.
    const { error } = await supabase.from(TABLE).insert(row);
    if (error) throw error;
    return rowToFeeding(row);
  }

  async delete(id: string): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from(TABLE)
      .update({ deleted_at: now, updated_at: now })
      .eq('id', id);
    if (error) throw error;
  }
}

function rowToFeeding(row: Record<string, unknown>): Feeding {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    foodType: row.food_type as string,
    amountGrams: (row.amount_grams as number | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    fedAt: row.fed_at as string,
    ownerId: (row.owner_id as string | null) ?? null,
    syncStatus: 'synced' as const,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
}
