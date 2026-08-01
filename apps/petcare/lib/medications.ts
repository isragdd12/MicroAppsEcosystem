import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@microapps/core';
import { addMedication, deleteMedication, listMedications, toggleMedication } from './api';

export const MEDS_KEY = ['medications'] as const;

export function useMedications(petId: string) {
  return useQuery({
    queryKey: [...MEDS_KEY, petId],
    queryFn: () => listMedications(petId),
    enabled: !!petId,
  });
}

export function useAddMedication() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      petId: string;
      name: string;
      dosage?: string;
      frequency?: string;
      startDate: string;
      endDate?: string;
      notes?: string;
    }) => addMedication(input, session?.user.id ?? null),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: [...MEDS_KEY, vars.petId] });
    },
  });
}

export function useToggleMedication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean; petId: string }) =>
      toggleMedication(id, isActive),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: [...MEDS_KEY, vars.petId] });
    },
  });
}

export function useDeleteMedication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; petId: string }) => deleteMedication(id),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: [...MEDS_KEY, vars.petId] });
    },
  });
}
