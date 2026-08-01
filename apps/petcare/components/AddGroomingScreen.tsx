import { useTheme } from '@microapps/core';
import { Button, Screen, TextInput } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useAddGrooming } from '../lib/grooming';
import { cardShadow } from '../lib/styles';
import type { GroomingLog } from '../lib/types';
import { DatePicker } from './DatePicker';

const GROOMING_TYPES: { value: GroomingLog['groomingType']; label: string; emoji: string }[] = [
  { value: 'bath', label: 'Bath', emoji: 'ðŸ›' },
  { value: 'haircut', label: 'Haircut', emoji: 'âœ‚ï¸' },
  { value: 'nail_trim', label: 'Nails', emoji: 'ðŸ’…' },
  { value: 'brushing', label: 'Brushing', emoji: 'ðŸª®' },
  { value: 'ear_cleaning', label: 'Ears', emoji: 'ðŸ‘‚' },
  { value: 'other', label: 'Other', emoji: 'ðŸ¾' },
];

export function AddGroomingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { mutateAsync: addGrooming, isPending } = useAddGrooming();

  const [groomingType, setGroomingType] = useState<GroomingLog['groomingType']>('bath');
  const [notes, setNotes] = useState('');
  const [groomedAt, setGroomedAt] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    try {
      setError(null);
      await addGrooming({
        petId: id,
        groomingType,
        notes: notes.trim() || undefined,
        groomedAt: new Date(groomedAt + 'T12:00:00').toISOString(),
      });
      router.back();
    } catch (e: unknown) {
      console.error('[AddGrooming] Failed to save:', e);
      setError('Failed to save grooming session. Please try again.');
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing(6) }}>
          Log Grooming âœ‚ï¸
        </Text>

        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>
          Type
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginBottom: spacing(5) }}>
          {GROOMING_TYPES.map((gt) => (
            <Pressable
              key={gt.value}
              onPress={() => setGroomingType(gt.value)}
              style={({ pressed }) => ({
                paddingHorizontal: spacing(3),
                paddingVertical: spacing(2),
                borderRadius: radii.lg,
                borderWidth: 2,
                borderColor: groomingType === gt.value ? colors.primary : colors.border,
                backgroundColor: groomingType === gt.value ? colors.primary : colors.surface,
                flexDirection: 'row', alignItems: 'center', gap: spacing(1),
                opacity: pressed ? 0.8 : 1,
                ...cardShadow,
              })}
            >
              <Text style={{ fontSize: 18 }}>{gt.emoji}</Text>
              <Text style={{ fontSize: typography.size.sm, fontWeight: '700', color: groomingType === gt.value ? colors.primaryText : colors.text }}>
                {gt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(4), ...cardShadow }}>
          <DatePicker label="Date *" value={groomedAt} onChange={setGroomedAt} />
          <View style={{ height: spacing(4) }} />
          <TextInput label="Notes" value={notes} onChangeText={setNotes} placeholder="Any notesâ€¦" />
        </View>

        {error && (
          <View style={{ backgroundColor: '#FFF3F3', borderRadius: radii.md, padding: spacing(3), marginBottom: spacing(3), borderLeftWidth: 4, borderLeftColor: colors.danger }}>
            <Text style={{ color: colors.danger, fontSize: typography.size.sm, fontWeight: '600' }}>{error}</Text>
          </View>
        )}
        <Button label={isPending ? 'Savingâ€¦' : 'Save session'} onPress={handleSave} />
        <View style={{ height: spacing(3) }} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
