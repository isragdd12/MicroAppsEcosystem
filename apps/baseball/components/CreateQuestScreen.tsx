import { useTheme } from '@microapps/core';
import { Screen } from '@microapps/ui';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useCreateQuest } from '../lib/quests';
import { QUEST_TYPE_COLORS, QUEST_TYPE_ICONS } from '../lib/quests';
import { cardShadow } from '../lib/styles';
import type { Quest } from '../lib/types';

const QUEST_TYPES: { value: Quest['questType']; label: string }[] = [
  { value: 'main', label: 'Main Quest' },
  { value: 'side', label: 'Side Quest' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'yoga', label: 'Yoga/Stretch' },
  { value: 'game', label: 'Game Day' },
];

export function CreateQuestScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { mutateAsync: createQuest } = useCreateQuest();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questType, setQuestType] = useState<Quest['questType']>('main');
  const [xpReward, setXpReward] = useState('50');
  const [rupeeReward, setRupeeReward] = useState('10');
  const [heartCost, setHeartCost] = useState('1');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing fields', 'Title and description are required.');
      return;
    }
    setLoading(true);
    try {
      const q = await createQuest({
        title: title.trim(),
        description: description.trim(),
        questType,
        xpReward: parseInt(xpReward) || 50,
        rupeeReward: parseInt(rupeeReward) || 10,
        heartCost: parseInt(heartCost) || 1,
        sections: [],
      });
      router.replace(`/quests/${q.id}`);
    } catch (e) {
      console.error('[CreateQuest] Failed:', e);
      Alert.alert('Error', 'Could not create quest.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(10) }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing(5), paddingTop: spacing(2) }}>
            <Pressable onPress={() => router.back()} style={{ marginRight: spacing(3) }}>
              <Text style={{ fontSize: 24, color: colors.text }}>{'←'}</Text>
            </Pressable>
            <Text style={{ fontSize: typography.size.xl, fontWeight: '900', color: colors.text }}>New Quest</Text>
          </View>

          {/* Quest type */}
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: spacing(2) }}>Quest Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing(4) }}>
            <View style={{ flexDirection: 'row', gap: spacing(2) }}>
              {QUEST_TYPES.map((t) => {
                const active = questType === t.value;
                const color = QUEST_TYPE_COLORS[t.value];
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => setQuestType(t.value)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: spacing(3),
                      paddingVertical: spacing(2),
                      borderRadius: radii.full,
                      backgroundColor: active ? color : colors.surface,
                      borderWidth: 2,
                      borderColor: color,
                      opacity: pressed ? 0.8 : 1,
                      gap: 6,
                    })}
                  >
                    <Text style={{ fontSize: 14 }}>{QUEST_TYPE_ICONS[t.value]}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#FFFFFF' : color }}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Title */}
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: spacing(1) }}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Master the Curveball"
            style={{ backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing(3), fontSize: 15, color: colors.text, marginBottom: spacing(3), borderWidth: 1.5, borderColor: colors.border }}
            placeholderTextColor={colors.textMuted}
          />

          {/* Description */}
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: spacing(1) }}>Description / Objective</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what you need to do to complete this quest..."
            multiline
            numberOfLines={4}
            style={{ backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing(3), fontSize: 15, color: colors.text, marginBottom: spacing(3), borderWidth: 1.5, borderColor: colors.border, minHeight: 100, textAlignVertical: 'top' }}
            placeholderTextColor={colors.textMuted}
          />

          {/* Rewards */}
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: spacing(2) }}>Rewards & Cost</Text>
          <View style={{ flexDirection: 'row', gap: spacing(3), marginBottom: spacing(5) }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>⭐ XP Reward</Text>
              <TextInput
                value={xpReward}
                onChangeText={setXpReward}
                keyboardType="number-pad"
                style={{ backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing(3), fontSize: 15, color: colors.text, borderWidth: 1.5, borderColor: colors.border, textAlign: 'center' }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>💎 Rupees</Text>
              <TextInput
                value={rupeeReward}
                onChangeText={setRupeeReward}
                keyboardType="number-pad"
                style={{ backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing(3), fontSize: 15, color: colors.text, borderWidth: 1.5, borderColor: colors.border, textAlign: 'center' }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>❤️ Heart Cost</Text>
              <TextInput
                value={heartCost}
                onChangeText={setHeartCost}
                keyboardType="number-pad"
                style={{ backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing(3), fontSize: 15, color: colors.text, borderWidth: 1.5, borderColor: colors.border, textAlign: 'center' }}
              />
            </View>
          </View>

          <Pressable
            onPress={handleCreate}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: loading ? colors.border : colors.primary,
              borderRadius: radii.lg,
              paddingVertical: spacing(4),
              alignItems: 'center',
              opacity: pressed ? 0.8 : 1,
              ...cardShadow,
            })}
          >
            <Text style={{ fontSize: 17, fontWeight: '900', color: loading ? colors.textMuted : colors.primaryText }}>
              {loading ? 'Creating...' : '📜 Create Quest'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
