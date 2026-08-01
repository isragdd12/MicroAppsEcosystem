import { useTheme } from '@microapps/core';
import { Screen, Spinner } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { useCompleteQuest, useDeleteQuest, useQuests } from '../lib/quests';
import { QUEST_TYPE_COLORS, QUEST_TYPE_ICONS } from '../lib/quests';
import { cardShadow } from '../lib/styles';
import type { Quest, QuestSection } from '../lib/types';

function confirmAction(msg: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(msg)) onConfirm();
  } else {
    Alert.alert('Confirm', msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', onPress: onConfirm },
    ]);
  }
}

export function QuestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { data: quests, isLoading } = useQuests();
  const { mutateAsync: completeQuest } = useCompleteQuest();
  const { mutateAsync: deleteQuest } = useDeleteQuest();
  const [completing, setCompleting] = useState(false);

  if (isLoading) return <Spinner />;

  const quest = (quests ?? []).find((q) => q.id === id);
  if (!quest) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 40 }}>❓</Text>
          <Text style={{ fontSize: 16, color: colors.textMuted, marginTop: spacing(2) }}>Quest not found</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: spacing(4) }}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Go back</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const typeColor = QUEST_TYPE_COLORS[quest.questType];
  const typeIcon = QUEST_TYPE_ICONS[quest.questType];
  const isActive = quest.status === 'active';

  async function handleComplete() {
    confirmAction(`Complete "${quest!.title}"? You'll earn ${quest!.xpReward} XP and ${quest!.rupeeReward} rupees!`, async () => {
      setCompleting(true);
      try {
        await completeQuest(quest!.id);
        Alert.alert('Quest Complete!', `+${quest!.xpReward} XP and +${quest!.rupeeReward} Rupees earned!`);
        router.back();
      } catch (e) {
        console.error('[QuestDetail] Complete failed:', e);
        Alert.alert('Error', 'Could not complete quest.');
      } finally {
        setCompleting(false);
      }
    });
  }

  async function handleDelete() {
    confirmAction('Delete this quest? This cannot be undone.', async () => {
      try {
        await deleteQuest(quest!.id);
        router.back();
      } catch (e) {
        console.error('[QuestDetail] Delete failed:', e);
      }
    });
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing(10) }} showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing(4), paddingTop: spacing(6), paddingBottom: spacing(2) }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: spacing(3) }}>
            <Text style={{ fontSize: 24, color: colors.text }}>{'←'}</Text>
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textMuted, flex: 1 }}>Quest Details</Text>
          <Pressable onPress={handleDelete}>
            <Text style={{ fontSize: 18, color: colors.danger }}>{'✕'}</Text>
          </Pressable>
        </View>

        {/* Hero card */}
        <View style={{ marginHorizontal: spacing(4), backgroundColor: colors.secondary, borderRadius: radii.lg, padding: spacing(5), marginBottom: spacing(5), ...cardShadow }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing(3) }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: typeColor, alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
              <Text style={{ fontSize: 28 }}>{typeIcon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(2), marginBottom: 4 }}>
                <View style={{ backgroundColor: typeColor, borderRadius: radii.sm, paddingHorizontal: spacing(2), paddingVertical: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase' }}>{quest.questType}</Text>
                </View>
                {quest.status === 'completed' && (
                  <View style={{ backgroundColor: '#2E7D32', borderRadius: radii.sm, paddingHorizontal: spacing(2), paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>COMPLETED</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: typography.size.lg, fontWeight: '900', color: '#FFFFFF' }}>{quest.title}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radii.md, padding: spacing(3) }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, marginBottom: 2 }}>❤️</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#FF6B6B' }}>{quest.heartCost}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Cost</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, marginBottom: 2 }}>⭐</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primary }}>{quest.xpReward}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>XP</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, marginBottom: 2 }}>💎</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#90CAF9' }}>{quest.rupeeReward}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Rupees</Text>
            </View>
          </View>
        </View>

        {/* Objective */}
        <View style={{ marginHorizontal: spacing(4), marginBottom: spacing(5) }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>Quest Objective</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), ...cardShadow }}>
            <Text style={{ fontSize: typography.size.sm, color: colors.text, lineHeight: 22 }}>{quest.description}</Text>
          </View>
        </View>

        {/* Sections */}
        {quest.sections.map((section, i) => (
          <QuestSectionBlock key={i} section={section} colors={colors} typography={typography} spacing={spacing} radii={radii} />
        ))}

        {/* Complete button */}
        {isActive && (
          <View style={{ paddingHorizontal: spacing(4), marginTop: spacing(2) }}>
            <Pressable
              onPress={handleComplete}
              disabled={completing}
              style={({ pressed }) => ({
                backgroundColor: colors.success,
                borderRadius: radii.lg,
                paddingVertical: spacing(4),
                alignItems: 'center',
                opacity: pressed || completing ? 0.7 : 1,
                ...cardShadow,
              })}
            >
              <Text style={{ fontSize: 17, fontWeight: '900', color: '#FFFFFF' }}>
                {completing ? 'Completing...' : '🏆 Complete Quest'}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function QuestSectionBlock({ section, colors, typography, spacing, radii }: {
  section: QuestSection;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radii: ReturnType<typeof useTheme>['radii'];
}) {
  return (
    <View style={{ marginHorizontal: spacing(4), marginBottom: spacing(4) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing(2) }}>
        <Text style={{ fontSize: 18, marginRight: spacing(2) }}>{section.icon}</Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 }}>{section.title}</Text>
      </View>
      <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, overflow: 'hidden', ...cardShadow }}>
        {section.exercises.map((ex, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: spacing(3), borderBottomWidth: i < section.exercises.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
            <Text style={{ flex: 1, fontSize: typography.size.sm, color: colors.text }}>{ex.name}</Text>
            <Text style={{ fontSize: typography.size.sm, fontWeight: '700', color: colors.primary }}>
              {ex.reps ?? ex.duration ?? ex.sets ?? ''}
            </Text>
          </View>
        ))}
        {section.required_materials && section.required_materials.length > 0 && (
          <View style={{ padding: spacing(3), backgroundColor: colors.surfaceAlt, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>Required: {section.required_materials.join(', ')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
