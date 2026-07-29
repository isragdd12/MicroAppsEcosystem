import { useTheme } from '@microapps/core';
import { EmptyState, ErrorState, Screen, Spinner } from '@microapps/ui';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Pressable, RefreshControl, SectionList, Text, View } from 'react-native';

import { useFeedings } from '../lib/feedings';
import { cardShadow, formatTime, timeAgo } from '../lib/styles';
import type { Feeding } from '../lib/types';

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function groupByDay(feedings: Feeding[]): { title: string; data: Feeding[] }[] {
  const map = new Map<string, Feeding[]>();
  for (const f of feedings) {
    const label = dayLabel(f.fedAt);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(f);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

function FeedingRow({ feeding }: { feeding: Feeding }) {
  const { colors, typography, spacing, radii } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing(3), marginBottom: spacing(2), ...cardShadow }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
        <Text style={{ fontSize: 20 }}>🍽️</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: typography.size.md, fontWeight: '600', color: colors.text }}>{feeding.foodType}</Text>
        <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>
          {formatTime(feeding.fedAt)}{feeding.amountGrams ? ` · ${feeding.amountGrams}g` : ''}
        </Text>
      </View>
      <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>{timeAgo(feeding.fedAt)}</Text>
    </View>
  );
}

export function FeedingLogScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const { data: feedings, isLoading, error, refetch } = useFeedings();

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message="Failed to load feeding log" />;

  const sections = groupByDay(feedings ?? []);

  return (
    <Screen>
      <View style={{ paddingHorizontal: spacing(4), paddingTop: spacing(4), flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(5) }}>
          <View>
            <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text }}>Feedings</Text>
            <Text style={{ fontSize: typography.size.sm, color: colors.textMuted }}>{feedings?.length ?? 0} total</Text>
          </View>
          <Pressable
            onPress={() => router.push('/feedings/add')}
            accessibilityRole="button"
            accessibilityLabel="Log feeding"
            style={{ backgroundColor: colors.secondary, borderRadius: 24, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', ...cardShadow }}
          >
            <Text style={{ color: colors.secondaryText, fontSize: 26, lineHeight: 28 }}>+</Text>
          </Pressable>
        </View>
        {sections.length === 0 ? (
          <EmptyState title="No feedings logged" message="Tap + to log your first feeding." />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(f) => f.id}
            renderItem={({ item }) => <FeedingRow feeding={item} />}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={{ fontSize: typography.size.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2), marginTop: spacing(3) }}>
                {title}
              </Text>
            )}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}
