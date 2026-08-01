import { useTheme } from '@microapps/core';
import { Screen, Spinner } from '@microapps/ui';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useFeedings } from '../lib/feedings';
import { usePets } from '../lib/pets';
import { cardShadow, speciesEmoji } from '../lib/styles';

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function last7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short' });
}

export function StatsScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { data: pets, isLoading: petsLoading } = usePets();
  const { data: feedings, isLoading: feedingsLoading } = useFeedings();

  if (petsLoading || feedingsLoading) return <Spinner />;

  const allFeedings = feedings ?? [];
  const allPets = pets ?? [];

  const days = last7Days();
  const feedingsByDay = days.map((d) => ({
    day: d,
    count: allFeedings.filter((f) => dayKey(f.fedAt) === d).length,
  }));
  const maxCount = Math.max(...feedingsByDay.map((d) => d.count), 1);

  const totalFeedings = allFeedings.length;
  const firstFed = allFeedings.length > 0 ? allFeedings[allFeedings.length - 1]?.fedAt : null;
  const daysSinceFirst = firstFed
    ? Math.max(1, Math.ceil((Date.now() - new Date(firstFed).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const avgPerDay = totalFeedings > 0 ? (totalFeedings / daysSinceFirst).toFixed(1) : '0';

  const foodFreq = allFeedings.reduce<Record<string, number>>((acc, f) => {
    acc[f.foodType] = (acc[f.foodType] ?? 0) + 1;
    return acc;
  }, {});
  const topFoods = Object.entries(foodFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const feedingsByPet = allPets.map((p) => ({
    pet: p,
    count: allFeedings.filter((f) => f.petId === p.id).length,
  })).sort((a, b) => b.count - a.count);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing(6) }}>
          Stats 📊
        </Text>

        {/* Summary cards */}
        <View style={{ flexDirection: 'row', gap: spacing(3), marginBottom: spacing(5) }}>
          <View style={{ flex: 1, backgroundColor: colors.primary, borderRadius: radii.lg, padding: spacing(4), alignItems: 'center', ...cardShadow }}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: colors.primaryText }}>{allPets.length}</Text>
            <Text style={{ fontSize: typography.size.sm, color: 'rgba(255,255,255,0.8)' }}>Pets</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.secondary, borderRadius: radii.lg, padding: spacing(4), alignItems: 'center', ...cardShadow }}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: colors.secondaryText }}>{totalFeedings}</Text>
            <Text style={{ fontSize: typography.size.sm, color: 'rgba(255,255,255,0.8)' }}>Feedings</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#6366F1', borderRadius: radii.lg, padding: spacing(4), alignItems: 'center', ...cardShadow }}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: '#fff' }}>{avgPerDay}</Text>
            <Text style={{ fontSize: typography.size.sm, color: 'rgba(255,255,255,0.8)' }}>Avg/day</Text>
          </View>
        </View>

        {/* 7-day feeding chart */}
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>
          Feedings — Last 7 Days
        </Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(5), ...cardShadow }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80 }}>
            {feedingsByDay.map((item) => {
              const barH = Math.max(4, (item.count / maxCount) * 64);
              const isToday = item.day === new Date().toISOString().slice(0, 10);
              return (
                <View key={item.day} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: item.count > 0 ? colors.primary : colors.textMuted, marginBottom: 2 }}>
                    {item.count > 0 ? item.count : ''}
                  </Text>
                  <View style={{
                    width: '60%',
                    height: barH,
                    borderRadius: 4,
                    backgroundColor: isToday ? colors.primary : item.count > 0 ? `${colors.primary}66` : colors.border,
                  }} />
                  <Text style={{ fontSize: 9, color: isToday ? colors.primary : colors.textMuted, marginTop: 4, fontWeight: isToday ? '700' : '400' }}>
                    {dayLabel(item.day)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Feedings per pet */}
        {feedingsByPet.length > 0 && (
          <>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>Feedings by Pet</Text>
            <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, overflow: 'hidden', marginBottom: spacing(5), ...cardShadow }}>
              {feedingsByPet.map((item, i) => (
                <Pressable
                  key={item.pet.id}
                  onPress={() => router.push(`/pets/${item.pet.id}`)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: spacing(3),
                    borderBottomWidth: i < feedingsByPet.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ fontSize: 22, marginRight: spacing(3) }}>{speciesEmoji(item.pet.species)}</Text>
                  <Text style={{ flex: 1, fontSize: typography.size.md, fontWeight: '700', color: colors.text }}>{item.pet.name}</Text>
                  <View style={{ backgroundColor: colors.primary, borderRadius: radii.full, paddingHorizontal: spacing(2), paddingVertical: 3 }}>
                    <Text style={{ fontSize: typography.size.xs, fontWeight: '700', color: colors.primaryText }}>{item.count}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Top foods */}
        {topFoods.length > 0 && (
          <>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>Most Fed Foods</Text>
            <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, overflow: 'hidden', marginBottom: spacing(5), ...cardShadow }}>
              {topFoods.map(([food, count], i) => (
                <View key={food} style={{ flexDirection: 'row', alignItems: 'center', padding: spacing(3), borderBottomWidth: i < topFoods.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
                    <Text style={{ fontSize: 16 }}>🍽️</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: typography.size.sm, fontWeight: '600', color: colors.text }}>{food}</Text>
                  <Text style={{ fontSize: typography.size.sm, color: colors.textMuted }}>{count}x</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {totalFeedings === 0 && (
          <View style={{ alignItems: 'center', padding: spacing(8) }}>
            <Text style={{ fontSize: 48, marginBottom: spacing(3) }}>📊</Text>
            <Text style={{ fontSize: typography.size.lg, fontWeight: '700', color: colors.text }}>No data yet</Text>
            <Text style={{ fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing(2) }}>
              Start logging feedings and walks to see your stats here
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
