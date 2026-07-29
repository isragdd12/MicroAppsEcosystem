import { useTheme } from '@microapps/core';
import { EmptyState, ErrorState, Screen, Spinner } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { cardShadow, formatDate } from '../lib/styles';
import { useDeleteWeight, useWeights } from '../lib/weights';
import type { PetWeight } from '../lib/types';
import { usePet } from '../lib/pets';

export function WeightTrackerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { data: pet } = usePet(id);
  const { data: weights, isLoading, error, refetch } = useWeights(id);
  const { mutateAsync: deleteWeight } = useDeleteWeight();

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message="Failed to load weights" />;

  function trendEmoji(index: number, list: PetWeight[]): string {
    if (index >= list.length - 1) return '';
    const curr = list[index]!.weightKg;
    const prev = list[index + 1]!.weightKg;
    if (curr > prev) return ' ↑';
    if (curr < prev) return ' ↓';
    return ' →';
  }

  function confirmDelete(w: PetWeight) {
    Alert.alert('Delete weight', `Remove ${w.weightKg}kg entry?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteWeight({ id: w.id, petId: id }); } },
    ]);
  }

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ backgroundColor: colors.primary, paddingTop: spacing(6), paddingBottom: spacing(4), paddingHorizontal: spacing(4) }}>
          <Pressable onPress={() => router.back()} style={{ marginBottom: spacing(3) }}>
            <Text style={{ color: colors.primaryText, fontSize: typography.size.md }}>← Back</Text>
          </Pressable>
          <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.primaryText }}>
            {pet?.name ?? 'Pet'}'s Weight
          </Text>
          <Text style={{ fontSize: typography.size.sm, color: 'rgba(255,255,255,0.8)', marginTop: spacing(1) }}>
            {weights?.length ?? 0} measurements
          </Text>
        </View>

        <View style={{ padding: spacing(4), flex: 1 }}>
          {/* Add button */}
          <Pressable
            onPress={() => router.push(`/pets/${id}/weight/add`)}
            style={{ backgroundColor: colors.primary, borderRadius: radii.lg, padding: spacing(4), alignItems: 'center', marginBottom: spacing(4), ...cardShadow }}
          >
            <Text style={{ fontSize: typography.size.md, fontWeight: '700', color: colors.primaryText }}>+ Add Weight Measurement</Text>
          </Pressable>

          {!weights || weights.length === 0 ? (
            <EmptyState title="No measurements yet" message="Add your first weight measurement to start tracking." />
          ) : (
            <FlatList
              data={weights}
              keyExtractor={(w) => w.id}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <Pressable
                  onLongPress={() => confirmDelete(item)}
                  style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(3), flexDirection: 'row', alignItems: 'center', ...cardShadow }}
                >
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
                    <Text style={{ fontSize: 22 }}>⚖️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: typography.size.lg, fontWeight: '700', color: colors.text }}>
                      {item.weightKg} kg
                      <Text style={{ color: item.weightKg > (weights[index + 1]?.weightKg ?? item.weightKg) ? colors.danger : colors.success }}>
                        {trendEmoji(index, weights)}
                      </Text>
                    </Text>
                    <Text style={{ fontSize: typography.size.sm, color: colors.textMuted }}>{formatDate(item.measuredAt)}</Text>
                    {item.notes ? <Text style={{ fontSize: typography.size.xs, color: colors.textMuted, marginTop: 2 }}>{item.notes}</Text> : null}
                  </View>
                  {index === 0 && (
                    <View style={{ backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: spacing(2), paddingVertical: 4 }}>
                      <Text style={{ fontSize: typography.size.xs, color: colors.primaryText, fontWeight: '700' }}>Latest</Text>
                    </View>
                  )}
                </Pressable>
              )}
            />
          )}
        </View>
      </View>
    </Screen>
  );
}
