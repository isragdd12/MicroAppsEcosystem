import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CreateFeedingInput } from '../validation/feedingSchema';

import { useFeedingRepository } from './useFeedingRepository';
import { FEEDINGS_QUERY_KEY } from './useFeedings';

export function useLogFeeding() {
  const repo = useFeedingRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateFeedingInput) => repo.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FEEDINGS_QUERY_KEY });
    },
  });
}
