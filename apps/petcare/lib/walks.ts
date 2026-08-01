import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@microapps/core';
import { addWalk, deleteWalk, listWalks } from './api';

export const WALKS_KEY = ['walks'] as const;

export function useWalks(petId: string) {
  return useQuery({
    queryKey: [...WALKS_KEY, petId],
    queryFn: () => listWalks(petId),
    enabled: !!petId,
  });
}

export function useAddWalk() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { petId: string; durationMinutes?: number; distanceKm?: number; routeNotes?: string; walkedAt: string }) =>
      addWalk(input, session?.user.id ?? null),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: [...WALKS_KEY, vars.petId] });
    },
  });
}

export function useDeleteWalk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; petId: string }) => deleteWalk(id),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: [...WALKS_KEY, vars.petId] });
    },
  });
}
