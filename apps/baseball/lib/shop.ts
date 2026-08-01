import { useAuth } from '@microapps/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listInventory, listShopItems, purchaseItem } from './api';

export function useShopItems() {
  return useQuery({
    queryKey: ['shop-items'],
    queryFn: listShopItems,
  });
}

export function useInventory() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? '';
  return useQuery({
    queryKey: ['inventory', userId],
    queryFn: () => listInventory(userId),
    enabled: !!userId,
  });
}

export function usePurchaseItem() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => purchaseItem(session!.user.id, itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['player'] });
    },
  });
}

export const RARITY_COLORS = {
  common: '#9E9E9E',
  rare: '#1565C0',
  epic: '#7B1FA2',
  legendary: '#D4A017',
};
