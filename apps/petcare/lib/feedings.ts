import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@microapps/core';

import type { CreateFeedingInput } from './types';
import { addFeeding, listFeedings, listFeedingsForPet } from './api';

export const FEEDINGS_KEY = ['feedings'] as const;

export function useFeedings() {
  return useQuery({ queryKey: FEEDINGS_KEY, queryFn: listFeedings });
}

export function useFeedingsForPet(petId: string) {
  return useQuery({
    queryKey: [...FEEDINGS_KEY, 'pet', petId],
    queryFn: () => listFeedingsForPet(petId),
    enabled: !!petId,
  });
}

export function useLogFeeding() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFeedingInput) =>
      addFeeding(input, session?.user.id ?? null),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: FEEDINGS_KEY }); },
  });
}
