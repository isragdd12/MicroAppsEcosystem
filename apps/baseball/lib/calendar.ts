import { useAuth } from '@microapps/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createCalendarTask, deleteCalendarTask, listCalendarTasks, toggleCalendarTask } from './api';

export function useCalendarTasks(weekStart?: string) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? '';
  return useQuery({
    queryKey: ['calendar', userId, weekStart],
    queryFn: () => listCalendarTasks(userId, weekStart),
    enabled: !!userId,
  });
}

export function useCreateCalendarTask() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createCalendarTask>[1]) =>
      createCalendarTask(session!.user.id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  });
}

export function useToggleCalendarTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      toggleCalendarTask(id, isCompleted),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  });
}

export function useDeleteCalendarTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCalendarTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  });
}

export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export function getWeekDays(weekStart: string): { date: string; label: string; short: string }[] {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { weekday: 'long' }),
      short: d.toLocaleDateString(undefined, { weekday: 'short' }),
    });
  }
  return days;
}
