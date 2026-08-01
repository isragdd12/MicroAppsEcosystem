import { v4 as uuidv4 } from 'uuid';

import { supabase } from '../config/supabase';
import type {
  Appointment,
  CreateFeedingInput,
  CreatePetInput,
  Expense,
  Feeding,
  GroomingLog,
  HealthRecord,
  Medication,
  Pet,
  PetWeight,
  WalkLog,
} from './types';
import { createFeedingSchema, createPetSchema } from './types';

const pc = () => supabase.schema('petcare');

// ─── Pets ───────────────────────────────────────────────────────────────────

export async function listPets(): Promise<Pet[]> {
  const { data, error } = await pc()
    .from('pets')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToPet);
}

export async function getPet(id: string): Promise<Pet | null> {
  const { data, error } = await pc()
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
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  const { error } = await pc().from('pets').insert(row);
  if (error) throw error;
  return rowToPet(row);
}

export async function updatePet(id: string, patch: Partial<CreatePetInput>): Promise<Pet> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.species !== undefined) updates.species = patch.species;
  if (patch.breed !== undefined) updates.breed = patch.breed;
  if (patch.birthDate !== undefined) updates.birth_date = patch.birthDate;
  if (patch.photoUrl !== undefined) updates.photo_url = patch.photoUrl;
  if (patch.notes !== undefined) updates.notes = patch.notes;

  const { error } = await pc().from('pets').update(updates).eq('id', id);
  if (error) throw error;
  const updated = await getPet(id);
  if (!updated) throw new Error(`Pet ${id} not found after update`);
  return updated;
}

export async function deletePet(id: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await pc()
    .from('pets')
    .update({ deleted_at: now, updated_at: now })
    .eq('id', id);
  if (error) throw error;
}

// ─── Feedings ────────────────────────────────────────────────────────────────

export async function listFeedings(): Promise<Feeding[]> {
  const { data, error } = await pc()
    .from('feedings')
    .select('*')
    .is('deleted_at', null)
    .order('fed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToFeeding);
}

export async function listFeedingsForPet(petId: string): Promise<Feeding[]> {
  const { data, error } = await pc()
    .from('feedings')
    .select('*')
    .eq('pet_id', petId)
    .is('deleted_at', null)
    .order('fed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToFeeding);
}

export async function addFeeding(input: CreateFeedingInput, ownerId: string | null): Promise<Feeding> {
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
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  const { error } = await pc().from('feedings').insert(row);
  if (error) throw error;
  return rowToFeeding(row);
}

// ─── Weights ─────────────────────────────────────────────────────────────────

export async function listWeights(petId: string): Promise<PetWeight[]> {
  const { data, error } = await pc()
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
  const { error } = await pc().from('pet_weights').insert(row);
  if (error) throw error;
  return rowToWeight(row);
}

export async function deleteWeight(id: string): Promise<void> {
  const { error } = await pc().from('pet_weights').delete().eq('id', id);
  if (error) throw error;
}

// ─── Health Records ──────────────────────────────────────────────────────────

export async function listHealthRecords(petId: string): Promise<HealthRecord[]> {
  const { data, error } = await pc()
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
  const { error } = await pc().from('health_records').insert(row);
  if (error) throw error;
  return rowToHealthRecord(row);
}

export async function deleteHealthRecord(id: string): Promise<void> {
  const { error } = await pc().from('health_records').delete().eq('id', id);
  if (error) throw error;
}

// ─── Walk Logs ───────────────────────────────────────────────────────────────

export async function listWalks(petId: string): Promise<WalkLog[]> {
  const { data, error } = await pc()
    .from('walk_logs')
    .select('*')
    .eq('pet_id', petId)
    .order('walked_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToWalk);
}

export async function addWalk(
  input: { petId: string; durationMinutes?: number; distanceKm?: number; routeNotes?: string; walkedAt: string },
  ownerId: string | null,
): Promise<WalkLog> {
  const now = new Date().toISOString();
  const row = {
    id: uuidv4(),
    pet_id: input.petId,
    duration_minutes: input.durationMinutes ?? null,
    distance_km: input.distanceKm ?? null,
    route_notes: input.routeNotes ?? null,
    walked_at: input.walkedAt,
    owner_id: ownerId,
    created_at: now,
  };
  const { error } = await pc().from('walk_logs').insert(row);
  if (error) throw error;
  return rowToWalk(row);
}

export async function deleteWalk(id: string): Promise<void> {
  const { error } = await pc().from('walk_logs').delete().eq('id', id);
  if (error) throw error;
}

// ─── Grooming Logs ───────────────────────────────────────────────────────────

export async function listGrooming(petId: string): Promise<GroomingLog[]> {
  const { data, error } = await pc()
    .from('grooming_logs')
    .select('*')
    .eq('pet_id', petId)
    .order('groomed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToGrooming);
}

export async function addGrooming(
  input: { petId: string; groomingType: GroomingLog['groomingType']; notes?: string; groomedAt: string },
  ownerId: string | null,
): Promise<GroomingLog> {
  const now = new Date().toISOString();
  const row = {
    id: uuidv4(),
    pet_id: input.petId,
    grooming_type: input.groomingType,
    notes: input.notes ?? null,
    groomed_at: input.groomedAt,
    owner_id: ownerId,
    created_at: now,
  };
  const { error } = await pc().from('grooming_logs').insert(row);
  if (error) throw error;
  return rowToGrooming(row);
}

export async function deleteGrooming(id: string): Promise<void> {
  const { error } = await pc().from('grooming_logs').delete().eq('id', id);
  if (error) throw error;
}

// ─── Medications ─────────────────────────────────────────────────────────────

export async function listMedications(petId: string): Promise<Medication[]> {
  const { data, error } = await pc()
    .from('medications')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToMedication);
}

export async function addMedication(
  input: {
    petId: string;
    name: string;
    dosage?: string;
    frequency?: string;
    startDate: string;
    endDate?: string;
    notes?: string;
  },
  ownerId: string | null,
): Promise<Medication> {
  const now = new Date().toISOString();
  const row = {
    id: uuidv4(),
    pet_id: input.petId,
    name: input.name,
    dosage: input.dosage ?? null,
    frequency: input.frequency ?? null,
    start_date: input.startDate,
    end_date: input.endDate ?? null,
    notes: input.notes ?? null,
    is_active: true,
    owner_id: ownerId,
    created_at: now,
  };
  const { error } = await pc().from('medications').insert(row);
  if (error) throw error;
  return rowToMedication(row);
}

export async function toggleMedication(id: string, isActive: boolean): Promise<void> {
  const { error } = await pc().from('medications').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
}

export async function deleteMedication(id: string): Promise<void> {
  const { error } = await pc().from('medications').delete().eq('id', id);
  if (error) throw error;
}

// ─── Appointments ────────────────────────────────────────────────────────────

export async function listAppointments(petId: string): Promise<Appointment[]> {
  const { data, error } = await pc()
    .from('appointments')
    .select('*')
    .eq('pet_id', petId)
    .order('scheduled_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToAppointment);
}

export async function listAllUpcomingAppointments(): Promise<Appointment[]> {
  const now = new Date().toISOString();
  const { data, error } = await pc()
    .from('appointments')
    .select('*')
    .eq('is_completed', false)
    .gte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(10);
  if (error) throw error;
  return (data ?? []).map(rowToAppointment);
}

export async function addAppointment(
  input: {
    petId: string;
    title: string;
    appointmentType: Appointment['appointmentType'];
    scheduledAt: string;
    notes?: string;
  },
  ownerId: string | null,
): Promise<Appointment> {
  const now = new Date().toISOString();
  const row = {
    id: uuidv4(),
    pet_id: input.petId,
    title: input.title,
    appointment_type: input.appointmentType,
    scheduled_at: input.scheduledAt,
    notes: input.notes ?? null,
    is_completed: false,
    owner_id: ownerId,
    created_at: now,
  };
  const { error } = await pc().from('appointments').insert(row);
  if (error) throw error;
  return rowToAppointment(row);
}

export async function completeAppointment(id: string): Promise<void> {
  const { error } = await pc().from('appointments').update({ is_completed: true }).eq('id', id);
  if (error) throw error;
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await pc().from('appointments').delete().eq('id', id);
  if (error) throw error;
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export async function listExpenses(petId: string): Promise<Expense[]> {
  const { data, error } = await pc()
    .from('expenses')
    .select('*')
    .eq('pet_id', petId)
    .order('expense_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToExpense);
}

export async function addExpense(
  input: {
    petId: string;
    category: Expense['category'];
    amount: number;
    currency?: string;
    description?: string;
    expenseDate: string;
  },
  ownerId: string | null,
): Promise<Expense> {
  const now = new Date().toISOString();
  const row = {
    id: uuidv4(),
    pet_id: input.petId,
    category: input.category,
    amount: input.amount,
    currency: input.currency ?? 'USD',
    description: input.description ?? null,
    expense_date: input.expenseDate,
    owner_id: ownerId,
    created_at: now,
  };
  const { error } = await pc().from('expenses').insert(row);
  if (error) throw error;
  return rowToExpense(row);
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await pc().from('expenses').delete().eq('id', id);
  if (error) throw error;
}

// ─── Row mappers ─────────────────────────────────────────────────────────────

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

function rowToWalk(row: Record<string, unknown>): WalkLog {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    durationMinutes: (row.duration_minutes as number | null) ?? null,
    distanceKm: (row.distance_km as number | null) ?? null,
    routeNotes: (row.route_notes as string | null) ?? null,
    walkedAt: row.walked_at as string,
    ownerId: (row.owner_id as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToGrooming(row: Record<string, unknown>): GroomingLog {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    groomingType: row.grooming_type as GroomingLog['groomingType'],
    notes: (row.notes as string | null) ?? null,
    groomedAt: row.groomed_at as string,
    ownerId: (row.owner_id as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToMedication(row: Record<string, unknown>): Medication {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    name: row.name as string,
    dosage: (row.dosage as string | null) ?? null,
    frequency: (row.frequency as string | null) ?? null,
    startDate: row.start_date as string,
    endDate: (row.end_date as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    isActive: row.is_active as boolean,
    ownerId: (row.owner_id as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToAppointment(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    title: row.title as string,
    appointmentType: row.appointment_type as Appointment['appointmentType'],
    scheduledAt: row.scheduled_at as string,
    notes: (row.notes as string | null) ?? null,
    isCompleted: row.is_completed as boolean,
    ownerId: (row.owner_id as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToExpense(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    category: row.category as Expense['category'],
    amount: row.amount as number,
    currency: row.currency as string,
    description: (row.description as string | null) ?? null,
    expenseDate: row.expense_date as string,
    ownerId: (row.owner_id as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}
