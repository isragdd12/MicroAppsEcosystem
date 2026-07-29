import { useQuery } from '@tanstack/react-query';

import { askAi } from '@microapps/core';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/env';
import { cachedAccessToken } from '../config/aiProvider';
import { listFeedingsForPet } from './api';

export function useFeedingInsight(petId: string, petName: string) {
  return useQuery({
    queryKey: ['feeding-insight', petId],
    queryFn: async () => {
      const feedings = (await listFeedingsForPet(petId)).slice(0, 20);
      if (feedings.length < 3) return null;

      const summary = feedings
        .map(
          (f) =>
            `${new Date(f.fedAt).toLocaleDateString()}: ${f.foodType}${f.amountGrams ? ` (${f.amountGrams}g)` : ''}`,
        )
        .join('\n');

      return askAi(
        {
          supabaseUrl: SUPABASE_URL,
          supabaseAnonKey: SUPABASE_ANON_KEY,
          getAccessToken: () => cachedAccessToken,
        },
        [
          {
            role: 'user',
            content: `Here are the recent feedings for ${petName}:\n\n${summary}\n\nProvide a 2-3 sentence insight about feeding patterns and any suggestions.`,
          },
        ],
        {
          systemPrompt:
            'You are a helpful pet care assistant. Give concise, practical insights about pet feeding patterns. Keep responses under 100 words.',
          maxTokens: 200,
          temperature: 0.5,
        },
      );
    },
    staleTime: 1000 * 60 * 30,
    enabled: !!petId && !!petName,
  });
}
