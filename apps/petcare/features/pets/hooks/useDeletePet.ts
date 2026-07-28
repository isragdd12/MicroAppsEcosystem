import { useMutation, useQueryClient } from '@tanstack/react-query';

import { usePetRepository } from './usePetRepository';
import { PETS_QUERY_KEY } from './usePets';

export function useDeletePet() {
  const repo = usePetRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      repo.delete(id);
      return Promise.resolve();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PETS_QUERY_KEY });
    },
  });
}
