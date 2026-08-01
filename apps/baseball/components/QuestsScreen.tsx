import { useTheme } from '@microapps/core';
import { Screen, Spinner } from '@microapps/ui';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useQuests } from '../lib/quests';
import { QUEST_TYPE_COLORS, QUEST_TYPE_ICONS } from '../lib/quests';
import { cardShadow, formatDate } from '../lib/styles';
import type { Quest } from '../lib/types';

const FILTERS: { label: string; value: string | undefined }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'All', value: undefined },
];

export function QuestsScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<string | undefined>('active');
  const { data: quests, isLoading } = useQuests(filter);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing(8) }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: spacing(4), paddingTop: spacing(6), paddingBottom: spacing(2) }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: typography.size.xxl, fontWeight: '900', color: colors.text }}>Quests 📜</Text>
            <Pressable
              onPress={() => router.push('/quests/create')}
              style={({ pressed }) => ({ backgroundColor: colors.primary, borderRadius: radii.full, paddingHorizontal: spacing(3), paddingVertical: spacing(2), opacity: pressed ? 0.8 : 1, ...cardShadow })}
            >
              <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primaryText }}>+ New</Text>
            </Pressable>
          </View>
        </View>

        {/* Filter tabs */}
        <View style={{ flexDirection: 'row', paddingHorizontal: spacing(4), gap: spacing(2), marginBottom: spacing(4) }}>
          {FILTERS.map((f) => (
            <Pressable
              key={String(f.value)}
              onPress={() => setFilter(f.value)}
              style={{ flex: 1, paddingVertical: spacing(2), borderRadius: radii.md, backgroundColor: filter === f.value ? colors.primary : colors.surface, alignItems: 'center', ...cardShadow }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: filter === f.value ? colors.primaryText : colors.textMuted }}>{f.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Quest list */}
        <View style={{ paddingHorizontal: spacing(4) }}>
          {isLoading ? (
            <Spinner />
          ) : (quests ?? []).length === 0 ? (
            <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(8), alignItems: 'center', ...cardShadow }}>
              <Text style={{ fontSize: 40, marginBottom: spacing(2) }}>📜</Text>
              <Text style={{ fontSize: typography.size.md, fontWeight: '700', color: colors.text }}>No quests yet</Text>
              <Text style={{ fontSize: typography.size.sm, color: colors.textMuted, marginTop: spacing(1), textAlign: 'center' }}>Create your first quest to start earning XP!</Text>
              <Pressable
                onPress={() => router.push('/quests/create')}
                style={({ pressed }) => ({ marginTop: spacing(4), backgroundColor: colors.primary, borderRadius: radii.md, paddingHorizontal: spacing(5), paddingVertical: spacing(3), opacity: pressed ? 0.8 : 1 })}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primaryText }}>Create Quest</Text>
              </Pressable>
            </View>
          ) : (
            (quests ?? []).map((quest) => <QuestCard key={quest.id} quest={quest} colors={colors} typography={typography} spacing={spacing} radii={radii} onPress={() => router.push(`/quests/${quest.id}`)} />)
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function QuestCard({ quest, colors, typography, spacing, radii, onPress }: {
  quest: Quest;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radii: ReturnType<typeof useTheme>['radii'];
  onPress: () => void;
}) {
  const typeColor = QUEST_TYPE_COLORS[quest.questType];
  const typeIcon = QUEST_TYPE_ICONS[quest.questType];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing(4),
        marginBottom: spacing(3),
        opacity: pressed ? 0.8 : 1,
        ...cardShadow,
        borderLeftWidth: 4,
        borderLeftColor: typeColor,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${typeColor}22`, alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
          <Text style={{ fontSize: 20 }}>{typeIcon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: typography.size.md, fontWeight: '800', color: colors.text }}>{quest.title}</Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.textMuted, marginTop: 2 }} numberOfLines={2}>{quest.description}</Text>
        </View>
        {quest.status === 'completed' && (
          <View style={{ backgroundColor: '#E8F5E9', borderRadius: radii.full, paddingHorizontal: spacing(2), paddingVertical: 3 }}>
            <Text style={{ fontSize: 11, color: colors.success, fontWeight: '700' }}>Done</Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: spacing(4), marginTop: spacing(2) }}>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>⭐ {quest.xpReward} XP</Text>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>💎 {quest.rupeeReward}</Text>
        <Text style={{ fontSize: 12, color: '#C62828' }}>❤️ -{quest.heartCost}</Text>
        {quest.dueDate && <Text style={{ fontSize: 12, color: colors.textMuted }}>📅 {formatDate(quest.dueDate)}</Text>}
      </View>
    </Pressable>
  );
}
