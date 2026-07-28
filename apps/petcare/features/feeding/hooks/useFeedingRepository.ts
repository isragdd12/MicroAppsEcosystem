import { useAuth } from '@microapps/auth';
import { useMemo } from 'react';

import { useDb } from '../../../config/DatabaseProvider';
import { FeedingRepository } from '../repository/FeedingRepository';

export function useFeedingRepository(): FeedingRepository {
  const db = useDb();
  const { session } = useAuth();
  const ownerId = session?.user.id ?? null;
  return useMemo(() => new FeedingRepository(db, () => ownerId), [db, ownerId]);
}
