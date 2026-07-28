import { useQuery } from '@tanstack/react-query';

import { usePetRepository } from './usePetRepository';

export function usePet(id: string) {
  const repo = usePetRepository();
  return useQuery({
    queryKey: ['pets', id],
    queryFn: () => repo.getById(id),
    enabled: !!id,
  });
}
