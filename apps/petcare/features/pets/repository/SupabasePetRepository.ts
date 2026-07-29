import { v4 as uuidv4 } from 'uuid';

import { supabase } from '../../../config/supabase';
import { createPetSchema, type CreatePetInput } from '../validation/petSchema';

import type { Pet } from './PetRepository';

// Queries the public-schema view (petcare_pets) which mirrors petcare.pets
// with RLS enforced via security_invoker. This avoids needing to expose
// the 'petcare' schema in PostgREST's db-schemas setting.
const TABLE = 'petcare_pets';

export class SupabasePetRepository {
  constructor(private readonly ownerId: string | null) {}

  async list(): Promise<Pet[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToPet);
  }

  async getById(id: string): Promise<Pet | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    if (error) return null;
    return data ? rowToPet(data) : null;
  }

  async create(input: CreatePetInput): Promise<Pet> {
    const validated = createPetSchema.parse(input);
    const now = new Date().toISOString();
    const row = {
      id: uuidv4(),
      name: validated.name,
      species: validated.species,
      breed: validated.breed ?? null,
      birth_date: validated.birthDate ?? null,
      photo_url: validated.photoUrl ?? null,
      notes: validated.notes ?? null,
      owner_id: this.ownerId,
      sync_status: 'synced',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    const { data, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return rowToPet(data);
  }

  async update(id: string, patch: Partial<CreatePetInput>): Promise<Pet> {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.species !== undefined) updates.species = patch.species;
    if (patch.breed !== undefined) updates.breed = patch.breed;
    if (patch.birthDate !== undefined) updates.birth_date = patch.birthDate;
    if (patch.photoUrl !== undefined) updates.photo_url = patch.photoUrl;
    if (patch.notes !== undefined) updates.notes = patch.notes;

    const { data, error } = await supabase
      .from(TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return rowToPet(data);
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

function rowToPet(row: Record<string, unknown>): Pet {
  return {
    id: row.id as string,
    name: row.name as string,
    species: row.species as string,
    breed: (row.breed as string | null) ?? null,
    birthDate: (row.birth_date as string | null) ?? null,
    photoUrl: (row.photo_url as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    ownerId: (row.owner_id as string | null) ?? null,
    syncStatus: 'synced' as const,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
}
