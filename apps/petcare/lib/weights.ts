import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@microapps/core';

import { addWeight, deleteWeight, listWeights } from './api';

export const WEIGHTS_KEY = ['weights'] as const;

export function useWeights(petId: string) {
  return useQuery({
    queryKey: [...WEIGHTS_KEY, petId],
    queryFn: () => listWeights(petId),
    enabled: !!petId,
  });
}

export function useAddWeight() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { petId: string; weightKg: number; measuredAt: string; notes?: string }) =>
      addWeight(input, session?.user.id ?? null),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: [...WEIGHTS_KEY, vars.petId] });
    },
  });
}

export function useDeleteWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; petId: string }) => deleteWeight(id),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: [...WEIGHTS_KEY, vars.petId] });
    },
  });
}
