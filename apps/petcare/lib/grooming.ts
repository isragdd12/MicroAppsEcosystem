import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@microapps/core';
import { addGrooming, deleteGrooming, listGrooming } from './api';
import type { GroomingLog } from './types';

export const GROOMING_KEY = ['grooming'] as const;

export function useGrooming(petId: string) {
  return useQuery({
    queryKey: [...GROOMING_KEY, petId],
    queryFn: () => listGrooming(petId),
    enabled: !!petId,
  });
}

export function useAddGrooming() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { petId: string; groomingType: GroomingLog['groomingType']; notes?: string; groomedAt: string }) =>
      addGrooming(input, session?.user.id ?? null),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: [...GROOMING_KEY, vars.petId] });
    },
  });
}

export function useDeleteGrooming() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; petId: string }) => deleteGrooming(id),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: [...GROOMING_KEY, vars.petId] });
    },
  });
}
