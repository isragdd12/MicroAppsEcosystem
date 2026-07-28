import { useQuery } from '@tanstack/react-query';

import { useFeedingRepository } from './useFeedingRepository';

export const FEEDINGS_QUERY_KEY = ['feedings'] as const;

export function useFeedings() {
  const repo = useFeedingRepository();
  return useQuery({
    queryKey: FEEDINGS_QUERY_KEY,
    queryFn: () => repo.list(),
  });
}

export function useFeedingsForPet(petId: string) {
  const repo = useFeedingRepository();
  return useQuery({
    queryKey: [...FEEDINGS_QUERY_KEY, 'pet', petId],
    queryFn: () => repo.listForPet(petId),
    enabled: !!petId,
  });
}
