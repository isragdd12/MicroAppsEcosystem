import { v4 as uuidv4 } from 'uuid';

import { supabase } from '../config/supabase';
import type { CreateFeedingInput, CreatePetInput, Feeding, HealthRecord, Pet, PetWeight } from './types';
import { createFeedingSchema, createPetSchema } from './types';

// ─── Pets ───────────────────────────────────────────────────────────────────

export async function listPets(): Promise<Pet[]> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToPet);
}

export async function getPet(id: string): Promise<Pet | null> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
  if (error) return null;
  return data ? rowToPet(data) : null;
}

export async function addPet(input: CreatePetInput, ownerId: string | null): Promise<Pet> {
  const v = createPetSchema.parse(input);
  const now = new Date().toISOString();
  const row = {
    id: uuidv4(),
    name: v.name,
    species: v.species,
    breed: v.breed ?? null,
    birth_date: v.birthDate ?? null,
    photo_url: v.photoUrl ?? null,
    notes: v.notes ?? null,
    owner_id: ownerId,
    sync_status: 'synced',
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  const { error } = await supabase.from('pets').insert(row);
  if (error) throw error;
  return rowToPet(row);
}

export async function updatePet(
  id: string,
  patch: Partial<CreatePetInput>,
): Promise<Pet> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.species !== undefined) updates.species = patch.species;
  if (patch.breed !== undefined) updates.breed = patch.breed;
  if (patch.birthDate !== undefined) updates.birth_date = patch.birthDate;
  if (patch.photoUrl !== undefined) updates.photo_url = patch.photoUrl;
  if (patch.notes !== undefined) updates.notes = patch.notes;

  const { error } = await supabase.from('pets').update(updates).eq('id', id);
  if (error) throw error;
  const updated = await getPet(id);
  if (!updated) throw new Error(`Pet ${id} not found after update`);
  return updated;
}

export async function deletePet(id: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('pets')
    .update({ deleted_at: now, updated_at: now })
    .eq('id', id);
  if (error) throw error;
}

// ─── Feedings ───────────────────────────────────────────────────────────────

export async function listFeedings(): Promise<Feeding[]> {
  const { data, error } = await supabase
    .from('feedings')
    .select('*')
    .is('deleted_at', null)
    .order('fed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToFeeding);
}

export async function listFeedingsForPet(petId: string): Promise<Feeding[]> {
  const { data, error } = await supabase
    .from('feedings')
    .select('*')
    .eq('pet_id', petId)
    .is('deleted_at', null)
    .order('fed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToFeeding);
}

export async function addFeeding(
  input: CreateFeedingInput,
  ownerId: string | null,
): Promise<Feeding> {
  const v = createFeedingSchema.parse(input);
  const now = new Date().toISOString();
  const row = {
    id: uuidv4(),
    pet_id: v.petId,
    food_type: v.foodType,
    amount_grams: v.amountGrams ?? null,
    notes: v.notes ?? null,
    fed_at: v.fedAt,
    owner_id: ownerId,
    sync_status: 'synced',
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  const { error } = await supabase.from('feedings').insert(row);
  if (error) throw error;
  return rowToFeeding(row);
}

// ─── Weights ────────────────────────────────────────────────────────────────

export async function listWeights(petId: string): Promise<PetWeight[]> {
  const { data, error } = await supabase
    .from('pet_weights')
    .select('*')
    .eq('pet_id', petId)
    .order('measured_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToWeight);
}

export async function addWeight(
  input: { petId: string; weightKg: number; measuredAt: string; notes?: string },
  ownerId: string | null,
): Promise<PetWeight> {
  const now = new Date().toISOString();
  const row = {
    id: uuidv4(),
    pet_id: input.petId,
    weight_kg: input.weightKg,
    measured_at: input.measuredAt,
    notes: input.notes ?? null,
    owner_id: ownerId,
    created_at: now,
  };
  const { error } = await supabase.from('pet_weights').insert(row);
  if (error) throw error;
  return rowToWeight(row);
}

export async function deleteWeight(id: string): Promise<void> {
  const { error } = await supabase.from('pet_weights').delete().eq('id', id);
  if (error) throw error;
}

// ─── Health Records ──────────────────────────────────────────────────────────

export async function listHealthRecords(petId: string): Promise<HealthRecord[]> {
  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .eq('pet_id', petId)
    .order('record_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToHealthRecord);
}

export async function addHealthRecord(
  input: {
    petId: string;
    recordType: 'vet_visit' | 'vaccination' | 'medication' | 'note';
    title: string;
    description?: string;
    recordDate: string;
    vetName?: string;
  },
  ownerId: string | null,
): Promise<HealthRecord> {
  const now = new Date().toISOString();
  const row = {
    id: uuidv4(),
    pet_id: input.petId,
    record_type: input.recordType,
    title: input.title,
    description: input.description ?? null,
    record_date: input.recordDate,
    vet_name: input.vetName ?? null,
    owner_id: ownerId,
    created_at: now,
  };
  const { error } = await supabase.from('health_records').insert(row);
  if (error) throw error;
  return rowToHealthRecord(row);
}

export async function deleteHealthRecord(id: string): Promise<void> {
  const { error } = await supabase.from('health_records').delete().eq('id', id);
  if (error) throw error;
}

// ─── Row mappers ────────────────────────────────────────────────────────────

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
    syncStatus: 'synced',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
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
    syncStatus: 'synced',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
}

function rowToWeight(row: Record<string, unknown>): PetWeight {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    weightKg: row.weight_kg as number,
    measuredAt: row.measured_at as string,
    notes: (row.notes as string | null) ?? null,
    ownerId: (row.owner_id as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToHealthRecord(row: Record<string, unknown>): HealthRecord {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    recordType: row.record_type as HealthRecord['recordType'],
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    recordDate: row.record_date as string,
    vetName: (row.vet_name as string | null) ?? null,
    ownerId: (row.owner_id as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}
