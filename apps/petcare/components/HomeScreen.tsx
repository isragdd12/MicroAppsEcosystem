import { useTheme } from '@microapps/core';
import { Screen, Spinner } from '@microapps/ui';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { useFeedings } from '../lib/feedings';
import { usePets } from '../lib/pets';
import { useUpcomingAppointments } from '../lib/appointments';
import { cardShadow, speciesEmoji, timeAgo, formatDate } from '../lib/styles';
import type { Pet } from '../lib/types';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayStr(): string {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function getLastFed(petId: string, feedings: { petId: string; fedAt: string }[]): string | null {
  const f = feedings.find((x) => x.petId === petId);
  return f ? f.fedAt : null;
}

function needsFeeding(lastFedAt: string | null): boolean {
  if (!lastFedAt) return true;
  const hoursAgo = (Date.now() - new Date(lastFedAt).getTime()) / (1000 * 60 * 60);
  return hoursAgo > 8;
}

function birthdayCountdown(pet: Pet): { text: string; urgent: boolean } | null {
  if (!pet.birthDate) return null;
  const birth = new Date(pet.birthDate);
  const now = new Date();
  const next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < now) next.setFullYear(now.getFullYear() + 1);
  const days = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return { text: `Birthday today! ${pet.name}`, urgent: true };
  if (days <= 7) return { text: `${pet.name}'s birthday in ${days} days`, urgent: false };
  return null;
}

export function HomeScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { data: pets, isLoading: petsLoading, refetch: refetchPets } = usePets();
  const { data: feedings, isLoading: feedingsLoading, refetch: refetchFeedings } = useFeedings();
  const { data: upcomingAppts } = useUpcomingAppointments();

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchPets(), refetchFeedings()]);
    setRefreshing(false);
  }, [refetchPets, refetchFeedings]);

  const isLoading = petsLoading || feedingsLoading;
  const recentFeedings = (feedings ?? []).slice(0, 5);
  const fedToday = (feedings ?? []).filter((f) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return new Date(f.fedAt) >= start;
  }).length;

  const hungerAlerts = (pets ?? []).filter((p) => needsFeeding(getLastFed(p.id, feedings ?? [])));
  const birthdays = (pets ?? []).map(birthdayCountdown).filter(Boolean) as { text: string; urgent: boolean }[];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing(8) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: spacing(4), paddingTop: spacing(6), paddingBottom: spacing(4) }}>
          <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text }}>
            {greeting()} 👋
          </Text>
          <Text style={{ fontSize: typography.size.sm, color: colors.textMuted, marginTop: spacing(1) }}>
            {todayStr()}
          </Text>
        </View>

        {/* Alerts */}
        {(birthdays.length > 0 || hungerAlerts.length > 0) && (
          <View style={{ paddingHorizontal: spacing(4), marginBottom: spacing(4), gap: spacing(2) }}>
            {birthdays.map((b, i) => (
              <View key={i} style={{ backgroundColor: b.urgent ? '#FFF3E0' : '#E8F5E9', borderRadius: radii.lg, padding: spacing(3), borderLeftWidth: 4, borderLeftColor: b.urgent ? '#FF9800' : colors.primary }}>
                <Text style={{ fontSize: typography.size.sm, fontWeight: '700', color: b.urgent ? '#E65100' : '#2E7D32' }}>
                  {b.urgent ? '🎂 ' : '🎉 '}{b.text}
                </Text>
              </View>
            ))}
            {hungerAlerts.length > 0 && (
              <View style={{ backgroundColor: '#FFF3F3', borderRadius: radii.lg, padding: spacing(3), borderLeftWidth: 4, borderLeftColor: colors.danger }}>
                <Text style={{ fontSize: typography.size.sm, fontWeight: '700', color: colors.danger }}>
                  {'🍽️ '}{hungerAlerts.length === 1
                    ? `${hungerAlerts[0]?.name ?? 'A pet'} hasn't been fed in a while`
                    : `${hungerAlerts.length} pets need feeding`}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Upcoming appointments */}
        {(upcomingAppts?.length ?? 0) > 0 && (
          <View style={{ paddingHorizontal: spacing(4), marginBottom: spacing(4) }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>Upcoming</Text>
            <View style={{ backgroundColor: '#E3F2FD', borderRadius: radii.lg, padding: spacing(3), ...cardShadow }}>
              {upcomingAppts!.slice(0, 3).map((a) => (
                <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing(1) }}>
                  <Text style={{ fontSize: 16, marginRight: spacing(2) }}>
                    {a.appointmentType === 'vet' ? '🏥' : a.appointmentType === 'groomer' ? '✂️' : '📅'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: typography.size.sm, fontWeight: '700', color: '#1565C0' }}>{a.title}</Text>
                    <Text style={{ fontSize: typography.size.xs, color: '#1976D2' }}>{formatDate(a.scheduledAt)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: spacing(3), paddingHorizontal: spacing(4), marginBottom: spacing(5) }}>
          <StatChip label="Pets" value={String(pets?.length ?? 0)} color={colors.primary} colors={colors} typography={typography} spacing={spacing} radii={radii} />
          <StatChip label="Fed Today" value={String(fedToday)} color={colors.secondary} colors={colors} typography={typography} spacing={spacing} radii={radii} />
          <StatChip label="Total" value={String(feedings?.length ?? 0)} color="#6366F1" colors={colors} typography={typography} spacing={spacing} radii={radii} />
        </View>

        {/* Quick actions */}
        <View style={{ paddingHorizontal: spacing(4), marginBottom: spacing(6) }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', gap: spacing(3) }}>
            <QuickAction emoji="🐾" label="Add Pet" color={colors.primary} textColor={colors.primaryText} onPress={() => router.push('/pets/add')} radii={radii} spacing={spacing} typography={typography} />
            <QuickAction emoji="🍽️" label="Log Feeding" color={colors.secondary} textColor={colors.secondaryText} onPress={() => router.push('/feedings/add')} radii={radii} spacing={spacing} typography={typography} />
            <QuickAction emoji="📊" label="Stats" color="#6366F1" textColor="#fff" onPress={() => router.push('/(tabs)/stats' as never)} radii={radii} spacing={spacing} typography={typography} />
          </View>
        </View>

        {/* My Pets */}
        {(pets?.length ?? 0) > 0 && (
          <View style={{ paddingHorizontal: spacing(4), marginBottom: spacing(6) }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>My Pets</Text>
            {pets!.slice(0, 4).map((pet) => {
              const lastFed = getLastFed(pet.id, feedings ?? []);
              const hungry = needsFeeding(lastFed);
              return (
                <Pressable
                  key={pet.id}
                  onPress={() => router.push(`/pets/${pet.id}`)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    borderRadius: radii.lg,
                    padding: spacing(3),
                    marginBottom: spacing(2),
                    opacity: pressed ? 0.8 : 1,
                    ...cardShadow,
                  })}
                >
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
                    <Text style={{ fontSize: 26 }}>{speciesEmoji(pet.species)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: typography.size.md, fontWeight: '700', color: colors.text }}>{pet.name}</Text>
                    <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</Text>
                  </View>
                  {hungry && (
                    <View style={{ backgroundColor: '#FFF3F3', borderRadius: radii.full, paddingHorizontal: spacing(2), paddingVertical: 4 }}>
                      <Text style={{ fontSize: 11, color: colors.danger, fontWeight: '700' }}>Hungry</Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 18, color: colors.textMuted, marginLeft: spacing(2) }}>{'›'}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Recent feedings */}
        <View style={{ paddingHorizontal: spacing(4) }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>Recent Feedings</Text>
          {isLoading ? (
            <Spinner />
          ) : recentFeedings.length === 0 ? (
            <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(6), alignItems: 'center', ...cardShadow }}>
              <Text style={{ fontSize: 32, marginBottom: spacing(2) }}>🍽️</Text>
              <Text style={{ fontSize: typography.size.md, fontWeight: '700', color: colors.text }}>No feedings yet</Text>
              <Text style={{ fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing(1) }}>Log your first feeding to see it here</Text>
            </View>
          ) : (
            recentFeedings.map((f) => {
              const pet = pets?.find((p) => p.id === f.petId);
              return (
                <View
                  key={f.id}
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
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
                    <Text style={{ fontSize: 20 }}>🍽️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: typography.size.sm, fontWeight: '700', color: colors.text }}>
                      {f.foodType}{pet ? ` · ${pet.name}` : ''}
                    </Text>
                    <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>
                      {timeAgo(f.fedAt)}{f.amountGrams ? ` · ${f.amountGrams}g` : ''}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function QuickAction({ emoji, label, color, textColor, onPress, radii, spacing, typography }: {
  emoji: string; label: string; color: string; textColor: string; onPress: () => void;
  radii: ReturnType<typeof useTheme>['radii'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  typography: ReturnType<typeof useTheme>['typography'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, backgroundColor: color, borderRadius: radii.lg, padding: spacing(3), alignItems: 'center', opacity: pressed ? 0.8 : 1, ...cardShadow })}
    >
      <Text style={{ fontSize: 26, marginBottom: spacing(1) }}>{emoji}</Text>
      <Text style={{ fontSize: typography.size.xs, fontWeight: '700', color: textColor, textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

function StatChip({ label, value, color, colors, typography, spacing, radii }: {
  label: string; value: string; color: string;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radii: ReturnType<typeof useTheme>['radii'];
}) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(3), alignItems: 'center', ...cardShadow }}>
      <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: spacing(1), textAlign: 'center' }}>{label}</Text>
    </View>
  );
}
