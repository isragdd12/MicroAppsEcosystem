import { useAuth } from '@microapps/auth';
import { useMemo } from 'react';
import { Platform } from 'react-native';

import { useDb } from '../../../config/DatabaseProvider';
import { PetRepository } from '../repository/PetRepository';
import { SupabasePetRepository } from '../repository/SupabasePetRepository';

export type AnyPetRepository = PetRepository | SupabasePetRepository;

export function usePetRepository(): AnyPetRepository {
  const { session } = useAuth();
  const ownerId = session?.user.id ?? null;
  const db = useDb();

  return useMemo(() => {
    if (Platform.OS === 'web' || !db) {
      return new SupabasePetRepository(ownerId);
    }
    return new PetRepository(db, () => ownerId);
  }, [db, ownerId]);
}
