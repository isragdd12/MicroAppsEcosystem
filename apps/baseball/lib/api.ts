import { supabase } from '../config/supabase';
import type {
  BadgeDefinition,
  CalendarTask,
  InventoryItem,
  LibraryDrill,
  LibraryLingo,
  LibraryWorkout,
  PlayerBadge,
  PlayerProfile,
  Quest,
  ShopItem,
} from './types';

const bb = () => supabase.schema('baseball');

// ─── Player Profile ───────────────────────────────────────────────────────────

function mapProfile(r: Record<string, unknown>): PlayerProfile {
  return {
    id: r.id as string,
    ownerId: r.owner_id as string,
    username: r.username as string,
    position: r.position as PlayerProfile['position'],
    ageGroup: r.age_group as PlayerProfile['ageGroup'],
    avatar: r.avatar as string,
    hearts: r.hearts as number,
    maxHearts: r.max_hearts as number,
    rupees: r.rupees as number,
    xp: r.xp as number,
    level: r.level as number,
    streakDays: r.streak_days as number,
    lastActiveDate: r.last_active_date as string | null,
    onboardingCompleted: r.onboarding_completed as boolean,
    goals: (r.goals as string[]) ?? [],
    scheduleDays: (r.schedule_days as string[]) ?? [],
    equipmentLevel: r.equipment_level as string,
    createdAt: r.created_at as string,
  };
}

export async function getPlayerProfile(userId: string): Promise<PlayerProfile | null> {
  const { data, error } = await bb()
    .from('player_profiles')
    .select('*')
    .eq('owner_id', userId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return mapProfile(data as Record<string, unknown>);
}

export async function createPlayerProfile(
  userId: string,
  input: {
    username: string;
    position: string;
    ageGroup: string;
    goals: string[];
    scheduleDays: string[];
    equipmentLevel: string;
  },
): Promise<PlayerProfile> {
  const { data, error } = await bb()
    .from('player_profiles')
    .insert({
      owner_id: userId,
      username: input.username,
      position: input.position,
      age_group: input.ageGroup,
      goals: input.goals,
      schedule_days: input.scheduleDays,
      equipment_level: input.equipmentLevel,
      onboarding_completed: true,
    })
    .select()
    .single();
  if (error) throw error;
  return mapProfile(data as Record<string, unknown>);
}

export async function updatePlayerProfile(
  profileId: string,
  updates: Partial<{
    hearts: number;
    rupees: number;
    xp: number;
    level: number;
    streakDays: number;
    lastActiveDate: string;
    username: string;
  }>,
): Promise<PlayerProfile> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.hearts !== undefined) dbUpdates.hearts = updates.hearts;
  if (updates.rupees !== undefined) dbUpdates.rupees = updates.rupees;
  if (updates.xp !== undefined) dbUpdates.xp = updates.xp;
  if (updates.level !== undefined) dbUpdates.level = updates.level;
  if (updates.streakDays !== undefined) dbUpdates.streak_days = updates.streakDays;
  if (updates.lastActiveDate !== undefined) dbUpdates.last_active_date = updates.lastActiveDate;
  if (updates.username !== undefined) dbUpdates.username = updates.username;

  const { data, error } = await bb()
    .from('player_profiles')
    .update(dbUpdates)
    .eq('id', profileId)
    .select()
    .single();
  if (error) throw error;
  return mapProfile(data as Record<string, unknown>);
}

// ─── Quests ───────────────────────────────────────────────────────────────────

function mapQuest(r: Record<string, unknown>): Quest {
  return {
    id: r.id as string,
    ownerId: r.owner_id as string,
    patternId: r.pattern_id as string | null,
    title: r.title as string,
    description: r.description as string,
    questType: r.quest_type as Quest['questType'],
    xpReward: r.xp_reward as number,
    rupeeReward: r.rupee_reward as number,
    heartCost: r.heart_cost as number,
    sections: (r.sections as Quest['sections']) ?? [],
    status: r.status as Quest['status'],
    completedAt: r.completed_at as string | null,
    dueDate: r.due_date as string | null,
    createdAt: r.created_at as string,
  };
}

export async function listQuests(userId: string, status?: string): Promise<Quest[]> {
  let q = bb().from('player_quests').select('*').eq('owner_id', userId).order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapQuest);
}

export async function createQuest(
  userId: string,
  input: {
    title: string;
    description: string;
    questType: string;
    xpReward: number;
    rupeeReward: number;
    heartCost: number;
    sections: Quest['sections'];
    dueDate?: string | null;
    patternId?: string | null;
  },
): Promise<Quest> {
  const { data, error } = await bb()
    .from('player_quests')
    .insert({
      owner_id: userId,
      title: input.title,
      description: input.description,
      quest_type: input.questType,
      xp_reward: input.xpReward,
      rupee_reward: input.rupeeReward,
      heart_cost: input.heartCost,
      sections: input.sections,
      due_date: input.dueDate ?? null,
      pattern_id: input.patternId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapQuest(data as Record<string, unknown>);
}

export async function completeQuest(questId: string): Promise<Quest> {
  const { data, error } = await bb()
    .from('player_quests')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', questId)
    .select()
    .single();
  if (error) throw error;
  return mapQuest(data as Record<string, unknown>);
}

export async function deleteQuest(questId: string): Promise<void> {
  const { error } = await bb().from('player_quests').delete().eq('id', questId);
  if (error) throw error;
}

// ─── Shop ─────────────────────────────────────────────────────────────────────

function mapShopItem(r: Record<string, unknown>): ShopItem {
  return {
    id: r.id as string,
    name: r.name as string,
    description: r.description as string,
    category: r.category as ShopItem['category'],
    icon: r.icon as string,
    priceRupees: r.price_rupees as number,
    isDailyDeal: r.is_daily_deal as boolean,
    rarity: r.rarity as ShopItem['rarity'],
    effect: (r.effect as Record<string, unknown>) ?? {},
    isActive: r.is_active as boolean,
  };
}

export async function listShopItems(): Promise<ShopItem[]> {
  const { data, error } = await bb()
    .from('shop_items')
    .select('*')
    .eq('is_active', true)
    .order('price_rupees');
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapShopItem);
}

function mapInventoryItem(r: Record<string, unknown>): InventoryItem {
  return {
    id: r.id as string,
    ownerId: r.owner_id as string,
    itemId: r.item_id as string,
    item: mapShopItem(r.item as Record<string, unknown>),
    quantity: r.quantity as number,
    acquiredAt: r.acquired_at as string,
  };
}

export async function listInventory(userId: string): Promise<InventoryItem[]> {
  const { data, error } = await bb()
    .from('player_inventory')
    .select('*, item:shop_items(*)')
    .eq('owner_id', userId);
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapInventoryItem);
}

export async function purchaseItem(userId: string, itemId: string): Promise<InventoryItem> {
  const { data, error } = await bb()
    .from('player_inventory')
    .insert({ owner_id: userId, item_id: itemId })
    .select('*, item:shop_items(*)')
    .single();
  if (error) throw error;
  return mapInventoryItem(data as Record<string, unknown>);
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function mapBadge(r: Record<string, unknown>): BadgeDefinition {
  return {
    id: r.id as string,
    name: r.name as string,
    description: r.description as string,
    category: r.category as BadgeDefinition['category'],
    tier: r.tier as BadgeDefinition['tier'],
    icon: r.icon as string,
    requirementType: r.requirement_type as string,
    requirementValue: r.requirement_value as number,
  };
}

export async function listBadgeDefinitions(): Promise<BadgeDefinition[]> {
  const { data, error } = await bb().from('badge_definitions').select('*').order('category').order('tier');
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapBadge);
}

export async function listPlayerBadges(userId: string): Promise<PlayerBadge[]> {
  const { data, error } = await bb()
    .from('player_badges')
    .select('*, badge:badge_definitions(*)')
    .eq('owner_id', userId);
  if (error) throw error;
  return (data as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    ownerId: r.owner_id as string,
    badgeId: r.badge_id as string,
    badge: mapBadge(r.badge as Record<string, unknown>),
    earnedAt: r.earned_at as string,
  }));
}

export async function awardBadge(userId: string, badgeId: string): Promise<void> {
  await bb().from('player_badges').insert({ owner_id: userId, badge_id: badgeId });
}

// ─── Calendar Tasks ───────────────────────────────────────────────────────────

function mapTask(r: Record<string, unknown>): CalendarTask {
  return {
    id: r.id as string,
    ownerId: r.owner_id as string,
    title: r.title as string,
    taskType: r.task_type as string,
    scheduledDate: r.scheduled_date as string,
    isCompleted: r.is_completed as boolean,
    questId: r.quest_id as string | null,
    notes: r.notes as string | null,
    createdAt: r.created_at as string,
  };
}

export async function listCalendarTasks(userId: string, weekStart?: string): Promise<CalendarTask[]> {
  let q = bb().from('calendar_tasks').select('*').eq('owner_id', userId).order('scheduled_date');
  if (weekStart) {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    q = q.gte('scheduled_date', weekStart).lt('scheduled_date', end.toISOString().slice(0, 10));
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapTask);
}

export async function createCalendarTask(
  userId: string,
  input: { title: string; taskType: string; scheduledDate: string; questId?: string | null; notes?: string | null },
): Promise<CalendarTask> {
  const { data, error } = await bb()
    .from('calendar_tasks')
    .insert({
      owner_id: userId,
      title: input.title,
      task_type: input.taskType,
      scheduled_date: input.scheduledDate,
      quest_id: input.questId ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapTask(data as Record<string, unknown>);
}

export async function toggleCalendarTask(taskId: string, isCompleted: boolean): Promise<CalendarTask> {
  const { data, error } = await bb()
    .from('calendar_tasks')
    .update({ is_completed: isCompleted })
    .eq('id', taskId)
    .select()
    .single();
  if (error) throw error;
  return mapTask(data as Record<string, unknown>);
}

export async function deleteCalendarTask(taskId: string): Promise<void> {
  const { error } = await bb().from('calendar_tasks').delete().eq('id', taskId);
  if (error) throw error;
}

// ─── Library ──────────────────────────────────────────────────────────────────

function mapWorkout(r: Record<string, unknown>): LibraryWorkout {
  return {
    id: r.id as string,
    title: r.title as string,
    description: r.description as string,
    category: r.category as LibraryWorkout['category'],
    durationMinutes: r.duration_minutes as number,
    exercises: (r.exercises as LibraryWorkout['exercises']) ?? [],
    difficulty: r.difficulty as string,
    positionTags: (r.position_tags as string[]) ?? [],
    icon: r.icon as string,
  };
}

export async function listWorkouts(): Promise<LibraryWorkout[]> {
  const { data, error } = await bb().from('library_workouts').select('*').order('title');
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapWorkout);
}

function mapDrill(r: Record<string, unknown>): LibraryDrill {
  return {
    id: r.id as string,
    title: r.title as string,
    description: r.description as string,
    skill: r.skill as LibraryDrill['skill'],
    equipmentNeeded: (r.equipment_needed as string[]) ?? [],
    steps: (r.steps as string[]) ?? [],
    tips: (r.tips as string[]) ?? [],
    icon: r.icon as string,
  };
}

export async function listDrills(): Promise<LibraryDrill[]> {
  const { data, error } = await bb().from('library_drills').select('*').order('title');
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapDrill);
}

function mapLingo(r: Record<string, unknown>): LibraryLingo {
  return {
    id: r.id as string,
    term: r.term as string,
    definition: r.definition as string,
    category: r.category as LibraryLingo['category'],
    example: r.example as string | null,
  };
}

export async function listLingo(): Promise<LibraryLingo[]> {
  const { data, error } = await bb().from('library_lingo').select('*').order('term');
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapLingo);
}
