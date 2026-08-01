import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@microapps/core';
import { addExpense, deleteExpense, listExpenses } from './api';
import type { Expense } from './types';

export const EXPENSES_KEY = ['expenses'] as const;

export function useExpenses(petId: string) {
  return useQuery({
    queryKey: [...EXPENSES_KEY, petId],
    queryFn: () => listExpenses(petId),
    enabled: !!petId,
  });
}

export function useAddExpense() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      petId: string;
      category: Expense['category'];
      amount: number;
      currency?: string;
      description?: string;
      expenseDate: string;
    }) => addExpense(input, session?.user.id ?? null),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: [...EXPENSES_KEY, vars.petId] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; petId: string }) => deleteExpense(id),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: [...EXPENSES_KEY, vars.petId] });
    },
  });
}
