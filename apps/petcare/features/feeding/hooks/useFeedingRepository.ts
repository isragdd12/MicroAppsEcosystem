import { useAuth } from '@microapps/auth';
import { useMemo } from 'react';
import { Platform } from 'react-native';

import { useDb } from '../../../config/DatabaseProvider';
import { FeedingRepository } from '../repository/FeedingRepository';
import { SupabaseFeedingRepository } from '../repository/SupabaseFeedingRepository';

export type AnyFeedingRepository =
  FeedingRepository | SupabaseFeedingRepository;

export function useFeedingRepository(): AnyFeedingRepository {
  const { session } = useAuth();
  const ownerId = session?.user.id ?? null;
  const db = useDb();

  return useMemo(() => {
    if (Platform.OS === 'web' || !db) {
      return new SupabaseFeedingRepository(ownerId);
    }
    return new FeedingRepository(db, () => ownerId);
  }, [db, ownerId]);
}
