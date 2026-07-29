import { useMutation, useQueryClient } from '@tanstack/react-query';

import { usePetRepository } from './usePetRepository';
import { PETS_QUERY_KEY } from './usePets';

export function useDeletePet() {
  const repo = usePetRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await repo.delete(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PETS_QUERY_KEY });
    },
  });
}
