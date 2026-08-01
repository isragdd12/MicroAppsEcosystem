import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@microapps/core';
import {
  addAppointment,
  completeAppointment,
  deleteAppointment,
  listAllUpcomingAppointments,
  listAppointments,
} from './api';
import type { Appointment } from './types';

export const APPT_KEY = ['appointments'] as const;

export function useAppointments(petId: string) {
  return useQuery({
    queryKey: [...APPT_KEY, petId],
    queryFn: () => listAppointments(petId),
    enabled: !!petId,
  });
}

export function useUpcomingAppointments() {
  return useQuery({
    queryKey: [...APPT_KEY, 'upcoming'],
    queryFn: listAllUpcomingAppointments,
  });
}

export function useAddAppointment() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      petId: string;
      title: string;
      appointmentType: Appointment['appointmentType'];
      scheduledAt: string;
      notes?: string;
    }) => addAppointment(input, session?.user.id ?? null),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: [...APPT_KEY, vars.petId] });
      void qc.invalidateQueries({ queryKey: [...APPT_KEY, 'upcoming'] });
    },
  });
}

export function useCompleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; petId: string }) => completeAppointment(id),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: [...APPT_KEY, vars.petId] });
      void qc.invalidateQueries({ queryKey: [...APPT_KEY, 'upcoming'] });
    },
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; petId: string }) => deleteAppointment(id),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: [...APPT_KEY, vars.petId] });
      void qc.invalidateQueries({ queryKey: [...APPT_KEY, 'upcoming'] });
    },
  });
}
