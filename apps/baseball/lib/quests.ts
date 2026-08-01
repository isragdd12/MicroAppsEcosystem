import { useAuth } from '@microapps/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { completeQuest, createQuest, deleteQuest, listQuests } from './api';
import type { Quest } from './types';

export function useQuests(status?: string) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? '';
  return useQuery({
    queryKey: ['quests', userId, status],
    queryFn: () => listQuests(userId, status),
    enabled: !!userId,
  });
}

export function useCreateQuest() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createQuest>[1]) =>
      createQuest(session!.user.id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quests'] }),
  });
}

export function useCompleteQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questId: string) => completeQuest(questId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quests'] });
      qc.invalidateQueries({ queryKey: ['player'] });
    },
  });
}

export function useDeleteQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questId: string) => deleteQuest(questId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quests'] }),
  });
}

export const QUEST_TYPE_COLORS: Record<Quest['questType'], string> = {
  main: '#D4A017',
  side: '#1B3A6B',
  seasonal: '#2E7D32',
  yoga: '#7B1FA2',
  game: '#C62828',
};

export const QUEST_TYPE_ICONS: Record<Quest['questType'], string> = {
  main: '⭐',
  side: '📋',
  seasonal: '🍂',
  yoga: '🧘',
  game: '⚾',
};
