import { useAuth } from '@microapps/core';
import { useQuery } from '@tanstack/react-query';

import { listBadgeDefinitions, listPlayerBadges } from './api';

export function useBadgeDefinitions() {
  return useQuery({ queryKey: ['badge-defs'], queryFn: listBadgeDefinitions });
}

export function usePlayerBadges() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? '';
  return useQuery({
    queryKey: ['player-badges', userId],
    queryFn: () => listPlayerBadges(userId),
    enabled: !!userId,
  });
}

export const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#D4A017',
  diamond: '#4FC3F7',
};

export const TIER_ORDER = ['bronze', 'silver', 'gold', 'diamond'];
