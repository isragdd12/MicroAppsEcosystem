import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@microapps/core';

import type { CreatePetInput } from './types';
import { addPet, deletePet, getPet, listPets, updatePet } from './api';

export const PETS_KEY = ['pets'] as const;

export function usePets() {
  return useQuery({ queryKey: PETS_KEY, queryFn: listPets });
}

export function usePet(id: string) {
  return useQuery({
    queryKey: [...PETS_KEY, id],
    queryFn: () => getPet(id),
    enabled: !!id,
  });
}

export function useCreatePet() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePetInput) =>
      addPet(input, session?.user.id ?? null),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: PETS_KEY }); },
  });
}

export function useUpdatePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CreatePetInput> }) =>
      updatePet(id, patch),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: PETS_KEY });
      void qc.invalidateQueries({ queryKey: [...PETS_KEY, id] });
    },
  });
}

export function useDeletePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePet(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: PETS_KEY }); },
  });
}
