import { useQuery } from '@tanstack/react-query';

import { aiProvider } from '../../../config/aiProvider';

import { useFeedingRepository } from './useFeedingRepository';

export function useFeedingInsight(petId: string, petName: string) {
  const repo = useFeedingRepository();

  return useQuery({
    queryKey: ['feeding-insight', petId],
    queryFn: async () => {
      const feedingsRaw = await repo.listForPet(petId);
      const feedings = feedingsRaw.slice(0, 20);
      if (feedings.length < 3) return null;

      const summary = feedings
        .map(
          (f) =>
            `${new Date(f.fedAt).toLocaleDateString()}: ${f.foodType}${f.amountGrams ? ` (${f.amountGrams}g)` : ''}`,
        )
        .join('\n');

      const result = await aiProvider.complete(
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

      return result.content;
    },
    staleTime: 1000 * 60 * 30,
    enabled: !!petId && !!petName,
  });
}
