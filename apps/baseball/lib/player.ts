import { useAuth } from '@microapps/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createPlayerProfile, getPlayerProfile, updatePlayerProfile } from './api';

export function usePlayerProfile() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? '';
  return useQuery({
    queryKey: ['player', userId],
    queryFn: () => getPlayerProfile(userId),
    enabled: !!userId,
  });
}

export function useCreateProfile() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createPlayerProfile>[1]) =>
      createPlayerProfile(session!.user.id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['player'] }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updatePlayerProfile>[1] }) =>
      updatePlayerProfile(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['player'] }),
  });
}

export function xpForLevel(level: number): number {
  return level * 100;
}

export function xpProgress(xp: number, level: number): number {
  const base = (level - 1) * 100;
  const next = level * 100;
  return Math.min(1, (xp - base) / (next - base));
}
