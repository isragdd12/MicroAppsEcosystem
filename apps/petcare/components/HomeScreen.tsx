import { useTheme } from '@microapps/core';
import { EmptyState, Screen, Spinner } from '@microapps/ui';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { useFeedings } from '../lib/feedings';
import { usePets } from '../lib/pets';
import { cardShadow, speciesEmoji, timeAgo } from '../lib/styles';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayStr(): string {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function countFedToday(feedings: { fedAt: string }[]): number {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return feedings.filter((f) => new Date(f.fedAt) >= todayStart).length;
}

export function HomeScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { data: pets, isLoading: petsLoading, refetch: refetchPets } = usePets();
  const { data: feedings, isLoading: feedingsLoading, refetch: refetchFeedings } = useFeedings();

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchPets(), refetchFeedings()]);
    setRefreshing(false);
  }, [refetchPets, refetchFeedings]);

  const isLoading = petsLoading || feedingsLoading;

  const recentFeedings = (feedings ?? []).slice(0, 5);
  const miniPets = (pets ?? []).slice(0, 3);
  const fedToday = countFedToday(feedings ?? []);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: spacing(6) }}>
          <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text }}>
            {greeting()} 🌟
          </Text>
          <Text style={{ fontSize: typography.size.sm, color: colors.textMuted, marginTop: spacing(1) }}>
            {todayStr()}
          </Text>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: spacing(3), marginBottom: spacing(6) }}>
          <StatChip label="Pets" value={String(pets?.length ?? 0)} color={colors.primary} colors={colors} typography={typography} spacing={spacing} radii={radii} />
          <StatChip label="Fed Today" value={String(fedToday)} color={colors.secondary} colors={colors} typography={typography} spacing={spacing} radii={radii} />
          <StatChip label="Total Feedings" value={String(feedings?.length ?? 0)} color="#6366F1" colors={colors} typography={typography} spacing={spacing} radii={radii} />
        </View>

        {/* Quick actions */}
        <SectionHeader label="Quick Actions" colors={colors} typography={typography} spacing={spacing} />
        <View style={{ flexDirection: 'row', gap: spacing(3), marginBottom: spacing(6) }}>
          <Pressable
            onPress={() => router.push('/pets/add')}
            style={{ flex: 1, backgroundColor: colors.primary, borderRadius: radii.lg, padding: spacing(4), alignItems: 'center', ...cardShadow }}
          >
            <Text style={{ fontSize: 24 }}>🐾</Text>
            <Text style={{ fontSize: typography.size.sm, fontWeight: '700', color: colors.primaryText, marginTop: spacing(1) }}>Add Pet</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/feedings/add')}
            style={{ flex: 1, backgroundColor: colors.secondary, borderRadius: radii.lg, padding: spacing(4), alignItems: 'center', ...cardShadow }}
          >
            <Text style={{ fontSize: 24 }}>🍽️</Text>
            <Text style={{ fontSize: typography.size.sm, fontWeight: '700', color: colors.secondaryText, marginTop: spacing(1) }}>Log Feeding</Text>
          </Pressable>
        </View>

        {/* My Pets mini-list */}
        {(pets?.length ?? 0) > 0 && (
          <>
            <SectionHeader label="My Pets" colors={colors} typography={typography} spacing={spacing} />
            <View style={{ marginBottom: spacing(6) }}>
              {miniPets.map((pet) => (
                <Pressable
                  key={pet.id}
                  onPress={() => router.push(`/pets/${pet.id}`)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    borderRadius: radii.lg,
                    padding: spacing(3),
                    marginBottom: spacing(2),
                    ...cardShadow,
                  }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
                    <Text style={{ fontSize: 22 }}>{speciesEmoji(pet.species)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: typography.size.md, fontWeight: '700', color: colors.text }}>{pet.name}</Text>
                    <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</Text>
                  </View>
                  <Text style={{ fontSize: typography.size.lg, color: colors.textMuted }}>›</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Recent feedings */}
        <SectionHeader label="Recent Feedings" colors={colors} typography={typography} spacing={spacing} />
        {isLoading ? (
          <Spinner />
        ) : recentFeedings.length === 0 ? (
          <EmptyState title="No feedings yet" message="Log your first feeding to see it here." />
        ) : (
          <View>
            {recentFeedings.map((f) => {
              const pet = pets?.find((p) => p.id === f.petId);
              return (
                <View
                  key={f.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    borderRadius: radii.md,
                    padding: spacing(3),
                    marginBottom: spacing(2),
                    ...cardShadow,
                  }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
                    <Text style={{ fontSize: 18 }}>🍽️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: typography.size.sm, fontWeight: '600', color: colors.text }}>
                      {f.foodType}{pet ? ` · ${pet.name}` : ''}
                    </Text>
                    <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>
                      {timeAgo(f.fedAt)}{f.amountGrams ? ` · ${f.amountGrams}g` : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function SectionHeader({ label, colors, typography, spacing }: { label: string; colors: ReturnType<typeof useTheme>['colors']; typography: ReturnType<typeof useTheme>['typography']; spacing: ReturnType<typeof useTheme>['spacing'] }) {
  return (
    <Text style={{ fontSize: typography.size.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>
      {label}
    </Text>
  );
}

function StatChip({ label, value, color, colors, typography, spacing, radii }: {
  label: string;
  value: string;
  color: string;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radii: ReturnType<typeof useTheme>['radii'];
}) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(3), alignItems: 'center', ...cardShadow }}>
      <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: typography.size.xs, color: colors.textMuted, marginTop: spacing(1), textAlign: 'center' }}>{label}</Text>
    </View>
  );
}
