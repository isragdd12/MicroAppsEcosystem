import { useAuth } from '@microapps/auth';
import { useMemo } from 'react';

import { useDb } from '../../../config/DatabaseProvider';
import { PetRepository } from '../repository/PetRepository';

export function usePetRepository(): PetRepository {
  const db = useDb();
  const { session } = useAuth();
  const ownerId = session?.user.id ?? null;
  return useMemo(() => new PetRepository(db, () => ownerId), [db, ownerId]);
}
