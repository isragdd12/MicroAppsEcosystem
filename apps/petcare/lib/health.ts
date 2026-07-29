import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@microapps/core';

import type { HealthRecord } from './types';
import { addHealthRecord, deleteHealthRecord, listHealthRecords } from './api';

export const HEALTH_KEY = ['health'] as const;

export function useHealthRecords(petId: string) {
  return useQuery({
    queryKey: [...HEALTH_KEY, petId],
    queryFn: () => listHealthRecords(petId),
    enabled: !!petId,
  });
}

export function useAddHealthRecord() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      petId: string;
      recordType: HealthRecord['recordType'];
      title: string;
      description?: string;
      recordDate: string;
      vetName?: string;
    }) => addHealthRecord(input, session?.user.id ?? null),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: [...HEALTH_KEY, vars.petId] });
    },
  });
}

export function useDeleteHealthRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; petId: string }) => deleteHealthRecord(id),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: [...HEALTH_KEY, vars.petId] });
    },
  });
}
