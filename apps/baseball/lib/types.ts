export type Position = 'pitcher' | 'catcher' | 'infielder' | 'outfielder' | 'designated_hitter';
export type AgeGroup = 'youth' | 'high_school' | 'college' | 'adult' | 'senior';
export type QuestType = 'main' | 'side' | 'seasonal' | 'yoga' | 'game';
export type QuestStatus = 'active' | 'completed' | 'failed';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond';
export type BadgeCategory = 'hitting' | 'pitching' | 'fielding' | 'conditioning' | 'mental' | 'team';
export type ItemCategory = 'equipment' | 'power_up' | 'cosmetic' | 'booster';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type LibraryCategory = 'strength' | 'speed' | 'flexibility' | 'endurance';
export type DrillSkill = 'hitting' | 'pitching' | 'fielding' | 'catching' | 'baserunning';
export type LingoCategory = 'general' | 'pitching' | 'hitting' | 'fielding' | 'strategy';

export interface Exercise {
  name: string;
  reps?: string;
  duration?: string;
  sets?: string;
}

export interface QuestSection {
  title: string;
  icon: string;
  exercises: Exercise[];
  required_materials?: string[];
}

export interface PlayerProfile {
  id: string;
  ownerId: string;
  username: string;
  position: Position;
  ageGroup: AgeGroup;
  avatar: string;
  hearts: number;
  maxHearts: number;
  rupees: number;
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string | null;
  onboardingCompleted: boolean;
  goals: string[];
  scheduleDays: string[];
  equipmentLevel: string;
  createdAt: string;
}

export interface Quest {
  id: string;
  ownerId: string;
  patternId: string | null;
  title: string;
  description: string;
  questType: QuestType;
  xpReward: number;
  rupeeReward: number;
  heartCost: number;
  sections: QuestSection[];
  status: QuestStatus;
  completedAt: string | null;
  dueDate: string | null;
  createdAt: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  icon: string;
  priceRupees: number;
  isDailyDeal: boolean;
  rarity: Rarity;
  effect: Record<string, unknown>;
  isActive: boolean;
}

export interface InventoryItem {
  id: string;
  ownerId: string;
  itemId: string;
  item: ShopItem;
  quantity: number;
  acquiredAt: string;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
  icon: string;
  requirementType: string;
  requirementValue: number;
}

export interface PlayerBadge {
  id: string;
  ownerId: string;
  badgeId: string;
  badge: BadgeDefinition;
  earnedAt: string;
}

export interface CalendarTask {
  id: string;
  ownerId: string;
  title: string;
  taskType: string;
  scheduledDate: string;
  isCompleted: boolean;
  questId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface LibraryWorkout {
  id: string;
  title: string;
  description: string;
  category: LibraryCategory;
  durationMinutes: number;
  exercises: Exercise[];
  difficulty: string;
  positionTags: string[];
  icon: string;
}

export interface LibraryDrill {
  id: string;
  title: string;
  description: string;
  skill: DrillSkill;
  equipmentNeeded: string[];
  steps: string[];
  tips: string[];
  icon: string;
}

export interface LibraryLingo {
  id: string;
  term: string;
  definition: string;
  category: LingoCategory;
  example: string | null;
}
