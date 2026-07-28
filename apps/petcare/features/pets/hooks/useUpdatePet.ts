import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CreatePetInput } from '../validation/petSchema';

import { usePetRepository } from './usePetRepository';
import { PETS_QUERY_KEY } from './usePets';

export function useUpdatePet() {
  const repo = usePetRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<CreatePetInput>;
    }) => Promise.resolve(repo.update(id, patch)),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: PETS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['pets', id] });
    },
  });
}
