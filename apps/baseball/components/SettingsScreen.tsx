import { useAuth, useTheme } from '@microapps/core';
import { Screen, Spinner } from '@microapps/ui';
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { TIER_COLORS, useBadgeDefinitions, usePlayerBadges } from '../lib/badges';
import { usePlayerProfile, xpProgress } from '../lib/player';
import { cardShadow, POSITION_LABELS } from '../lib/styles';

export function SettingsScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  const { signOut, status } = useAuth();
  const { data: profile, isLoading } = usePlayerProfile();
  const { data: badgeDefs } = useBadgeDefinitions();
  const { data: playerBadges } = usePlayerBadges();

  async function handleSignOut() {
    const confirm = Platform.OS === 'web'
      ? window.confirm('Sign out?')
      : await new Promise<boolean>((resolve) => Alert.alert('Sign out?', '', [{ text: 'Cancel', onPress: () => resolve(false) }, { text: 'Sign Out', style: 'destructive', onPress: () => resolve(true) }]));
    if (confirm) await signOut();
  }

  if (isLoading) return <Spinner />;
  if (!profile) return null;

  const earnedBadgeIds = new Set((playerBadges ?? []).map((b) => b.badgeId));
  const progress = xpProgress(profile.xp, profile.level);

  const badgesByCategory = (badgeDefs ?? []).reduce<Record<string, typeof badgeDefs>>((acc, b) => {
    if (!b) return acc;
    if (!acc[b.category]) acc[b.category] = [];
    acc[b.category]!.push(b);
    return acc;
  }, {});

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing(10) }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: spacing(4), paddingTop: spacing(6), paddingBottom: spacing(4) }}>
          <Text style={{ fontSize: typography.size.xxl, fontWeight: '900', color: colors.text }}>Profile ⚙️</Text>
        </View>

        {/* Player card */}
        <View style={{ marginHorizontal: spacing(4), backgroundColor: colors.secondary, borderRadius: radii.lg, padding: spacing(5), marginBottom: spacing(5), ...cardShadow }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing(4) }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: spacing(4) }}>
              <Text style={{ fontSize: 36 }}>⚾</Text>
            </View>
            <View>
              <Text style={{ fontSize: typography.size.xl, fontWeight: '900', color: '#FFFFFF' }}>{profile.username}</Text>
              <Text style={{ fontSize: typography.size.sm, color: 'rgba(255,255,255,0.7)' }}>
                {POSITION_LABELS[profile.position] ?? profile.position}
              </Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radii.md, padding: spacing(3), marginBottom: spacing(3) }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: colors.primary }}>Lv {profile.level}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Level</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#FF6B6B' }}>{'❤️'.repeat(profile.hearts)}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Hearts</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#90CAF9' }}>💎 {profile.rupees}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Rupees</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFFFFF' }}>🔥 {profile.streakDays}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Streak</Text>
            </View>
          </View>

          {/* XP bar */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '700' }}>XP {profile.xp}</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Next level: {profile.level * 100}</Text>
            </View>
            <View style={{ height: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 5, overflow: 'hidden' }}>
              <View style={{ height: 10, backgroundColor: colors.primary, borderRadius: 5, width: `${Math.round(progress * 100)}%` }} />
            </View>
          </View>
        </View>

        {/* Goals & Schedule */}
        <View style={{ marginHorizontal: spacing(4), marginBottom: spacing(5) }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>My Goals</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), ...cardShadow }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) }}>
              {profile.goals.length === 0 ? (
                <Text style={{ fontSize: 14, color: colors.textMuted }}>No goals set</Text>
              ) : profile.goals.map((g) => (
                <View key={g} style={{ backgroundColor: colors.surfaceAlt, borderRadius: radii.full, paddingHorizontal: spacing(3), paddingVertical: spacing(1) }}>
                  <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>{g}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Badges */}
        <View style={{ marginHorizontal: spacing(4), marginBottom: spacing(5) }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>
            Badges ({(playerBadges ?? []).length}/{(badgeDefs ?? []).length})
          </Text>
          {Object.entries(badgesByCategory).map(([category, defs]) => (
            <View key={category} style={{ marginBottom: spacing(4) }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, textTransform: 'capitalize', marginBottom: spacing(2) }}>{category}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) }}>
                {(defs ?? []).map((badge) => {
                  if (!badge) return null;
                  const earned = earnedBadgeIds.has(badge.id);
                  const tierColor = TIER_COLORS[badge.tier];
                  return (
                    <View key={badge.id} style={{ alignItems: 'center', width: 72, opacity: earned ? 1 : 0.4 }}>
                      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: earned ? `${tierColor}33` : colors.surfaceAlt, borderWidth: 2, borderColor: earned ? tierColor : colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                        <Text style={{ fontSize: 24 }}>{badge.icon}</Text>
                      </View>
                      <Text style={{ fontSize: 9, textAlign: 'center', color: earned ? colors.text : colors.textMuted, fontWeight: earned ? '700' : '400' }} numberOfLines={2}>{badge.name}</Text>
                      <Text style={{ fontSize: 8, color: tierColor, fontWeight: '700', textTransform: 'uppercase' }}>{badge.tier}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Sign out */}
        <View style={{ marginHorizontal: spacing(4) }}>
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => ({
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              paddingVertical: spacing(4),
              alignItems: 'center',
              opacity: pressed ? 0.8 : 1,
              borderWidth: 2,
              borderColor: colors.danger,
            })}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.danger }}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
