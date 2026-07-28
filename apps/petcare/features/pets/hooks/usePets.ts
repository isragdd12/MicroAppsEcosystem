import { useQuery } from '@tanstack/react-query';

import { usePetRepository } from './usePetRepository';

export const PETS_QUERY_KEY = ['pets'] as const;

export function usePets() {
  const repo = usePetRepository();
  return useQuery({
    queryKey: PETS_QUERY_KEY,
    queryFn: () => repo.list(),
  });
}
