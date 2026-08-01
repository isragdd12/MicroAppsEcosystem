import { useTheme } from '@microapps/core';
import { Screen, Spinner } from '@microapps/ui';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { usePlayerProfile, useUpdateProfile } from '../lib/player';
import { RARITY_COLORS, useInventory, usePurchaseItem, useShopItems } from '../lib/shop';
import { cardShadow } from '../lib/styles';
import type { InventoryItem, ShopItem } from '../lib/types';

const TABS = ['Shop', 'Inventory'] as const;

export function ShopScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  const [tab, setTab] = useState<'Shop' | 'Inventory'>('Shop');
  const { data: items, isLoading: itemsLoading } = useShopItems();
  const { data: inventory, isLoading: inventoryLoading } = useInventory();
  const { data: profile } = usePlayerProfile();
  const { mutateAsync: purchase } = usePurchaseItem();
  const { mutateAsync: updateProfile } = useUpdateProfile();

  const isLoading = itemsLoading || inventoryLoading;
  const dailyDeals = (items ?? []).filter((i) => i.isDailyDeal);
  const regularItems = (items ?? []).filter((i) => !i.isDailyDeal);

  async function handleBuy(item: ShopItem) {
    if (!profile) return;
    if (profile.rupees < item.priceRupees) {
      Alert.alert('Not enough rupees!', `You need ${item.priceRupees - profile.rupees} more rupees.`);
      return;
    }
    try {
      await purchase(item.id);
      await updateProfile({ id: profile.id, updates: { rupees: profile.rupees - item.priceRupees } });
      Alert.alert('Purchased!', `${item.name} added to your inventory.`);
    } catch (e) {
      console.error('[Shop] Purchase failed:', e);
      Alert.alert('Error', 'Purchase failed. Please try again.');
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing(8) }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: spacing(4), paddingTop: spacing(6), paddingBottom: spacing(2) }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: typography.size.xxl, fontWeight: '900', color: colors.text }}>Shop 🛒</Text>
            {profile && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.full, paddingHorizontal: spacing(3), paddingVertical: spacing(1), ...cardShadow }}>
                <Text style={{ fontSize: 16, marginRight: 4 }}>💎</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>{profile.rupees}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', paddingHorizontal: spacing(4), gap: spacing(2), marginBottom: spacing(4) }}>
          {TABS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={{ flex: 1, paddingVertical: spacing(2), borderRadius: radii.md, backgroundColor: tab === t ? colors.primary : colors.surface, alignItems: 'center', ...cardShadow }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: tab === t ? colors.primaryText : colors.textMuted }}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? <Spinner /> : tab === 'Shop' ? (
          <View style={{ paddingHorizontal: spacing(4) }}>
            {/* Daily deals */}
            {dailyDeals.length > 0 && (
              <>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>Daily Deals</Text>
                {dailyDeals.map((item) => (
                  <ShopCard key={item.id} item={item} onBuy={() => handleBuy(item)} colors={colors} typography={typography} spacing={spacing} radii={radii} />
                ))}
              </>
            )}

            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2), marginTop: dailyDeals.length > 0 ? spacing(4) : 0 }}>All Items</Text>
            {regularItems.map((item) => (
              <ShopCard key={item.id} item={item} onBuy={() => handleBuy(item)} colors={colors} typography={typography} spacing={spacing} radii={radii} />
            ))}
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing(4) }}>
            {(inventory ?? []).length === 0 ? (
              <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(8), alignItems: 'center', ...cardShadow }}>
                <Text style={{ fontSize: 40, marginBottom: spacing(2) }}>🎒</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Inventory empty</Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center' }}>Buy items from the shop to see them here</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(3) }}>
                {(inventory ?? []).map((inv) => (
                  <InventoryCard key={inv.id} item={inv} colors={colors} typography={typography} spacing={spacing} radii={radii} />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function ShopCard({ item, onBuy, colors, typography, spacing, radii }: {
  item: ShopItem;
  onBuy: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radii: ReturnType<typeof useTheme>['radii'];
}) {
  const rarityColor = RARITY_COLORS[item.rarity];
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(3), ...cardShadow, borderTopWidth: 3, borderTopColor: rarityColor }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: `${rarityColor}22`, alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
          <Text style={{ fontSize: 28 }}>{item.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Text style={{ fontSize: typography.size.md, fontWeight: '800', color: colors.text }}>{item.name}</Text>
            {item.isDailyDeal && (
              <View style={{ backgroundColor: '#FF6B35', borderRadius: radii.sm, paddingHorizontal: 5, paddingVertical: 1 }}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFFFFF' }}>DEAL</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 10, fontWeight: '700', color: rarityColor, textTransform: 'uppercase' }}>{item.rarity}</Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.textMuted, marginTop: 2 }}>{item.description}</Text>
        </View>
        <Pressable
          onPress={onBuy}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            borderRadius: radii.md,
            paddingHorizontal: spacing(3),
            paddingVertical: spacing(2),
            alignItems: 'center',
            opacity: pressed ? 0.8 : 1,
            minWidth: 64,
          })}
        >
          <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primaryText }}>💎 {item.priceRupees}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function InventoryCard({ item, colors, typography, spacing, radii }: {
  item: InventoryItem;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radii: ReturnType<typeof useTheme>['radii'];
}) {
  const rarityColor = RARITY_COLORS[item.item.rarity];
  return (
    <View style={{ width: '47%', backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(3), alignItems: 'center', ...cardShadow, borderWidth: 2, borderColor: rarityColor }}>
      <Text style={{ fontSize: 36, marginBottom: spacing(1) }}>{item.item.icon}</Text>
      <Text style={{ fontSize: typography.size.xs, fontWeight: '800', color: colors.text, textAlign: 'center' }} numberOfLines={2}>{item.item.name}</Text>
      {item.quantity > 1 && (
        <View style={{ marginTop: 4, backgroundColor: colors.primary, borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primaryText }}>x{item.quantity}</Text>
        </View>
      )}
    </View>
  );
}
