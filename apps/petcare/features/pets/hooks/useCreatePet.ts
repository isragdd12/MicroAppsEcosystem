import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CreatePetInput } from '../validation/petSchema';

import { usePetRepository } from './usePetRepository';
import { PETS_QUERY_KEY } from './usePets';

export function useCreatePet() {
  const repo = usePetRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePetInput) => Promise.resolve(repo.create(input)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PETS_QUERY_KEY });
    },
  });
}
