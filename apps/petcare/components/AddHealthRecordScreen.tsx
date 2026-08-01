import { useTheme } from '@microapps/core';
import { Button, Screen, TextInput } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useAddHealthRecord } from '../lib/health';
import { cardShadow } from '../lib/styles';
import type { HealthRecord } from '../lib/types';
import { DatePicker } from './DatePicker';

const RECORD_TYPES: { value: HealthRecord['recordType']; label: string; emoji: string; color: string }[] = [
  { value: 'vet_visit', label: 'Vet Visit', emoji: 'ðŸ¥', color: '#4CAF50' },
  { value: 'vaccination', label: 'Vaccination', emoji: 'ðŸ’‰', color: '#2196F3' },
  { value: 'medication', label: 'Medication', emoji: 'ðŸ’Š', color: '#FF9800' },
  { value: 'note', label: 'Note', emoji: 'ðŸ“', color: '#9C27B0' },
];

export function AddHealthRecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { mutateAsync: addRecord, isPending } = useAddHealthRecord();

  const [recordType, setRecordType] = useState<HealthRecord['recordType']>('vet_visit');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [vetName, setVetName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    try {
      setError(null);
      if (!title.trim()) { setError('Title is required'); return; }
      await addRecord({
        petId: id,
        recordType,
        title: title.trim(),
        description: description.trim() || undefined,
        recordDate,
        vetName: vetName.trim() || undefined,
      });
      router.back();
    } catch (e: unknown) {
      console.error('[AddHealthRecord] Failed to save record:', e);
      setError('Failed to save record. Please try again.');
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing(6) }}>
          Add Health Record
        </Text>

        {/* Type selector */}
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>
          Record Type
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginBottom: spacing(5) }}>
          {RECORD_TYPES.map((rt) => {
            const active = recordType === rt.value;
            return (
              <Pressable
                key={rt.value}
                onPress={() => setRecordType(rt.value)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: spacing(3),
                  paddingVertical: spacing(2),
                  borderRadius: radii.lg,
                  borderWidth: 2,
                  borderColor: active ? rt.color : colors.border,
                  backgroundColor: active ? rt.color : colors.surface,
                  opacity: pressed ? 0.8 : 1,
                  ...cardShadow,
                })}
              >
                <Text style={{ fontSize: 18, marginRight: spacing(1) }}>{rt.emoji}</Text>
                <Text style={{ fontSize: typography.size.sm, fontWeight: '700', color: active ? '#fff' : colors.text }}>
                  {rt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(4), ...cardShadow }}>
          <TextInput label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. Annual checkup" />
          <View style={{ height: spacing(4) }} />
          <TextInput label="Description" value={description} onChangeText={setDescription} placeholder="Optional detailsâ€¦" />
          <View style={{ height: spacing(4) }} />
          <DatePicker label="Date *" value={recordDate} onChange={setRecordDate} />
          {(recordType === 'vet_visit' || recordType === 'vaccination') && (
            <>
              <View style={{ height: spacing(4) }} />
              <TextInput label="Vet name" value={vetName} onChangeText={setVetName} placeholder="e.g. Dr. Smith" />
            </>
          )}
        </View>

        {error && (
          <View style={{ backgroundColor: '#FFF3F3', borderRadius: radii.md, padding: spacing(3), marginBottom: spacing(3), borderLeftWidth: 4, borderLeftColor: colors.danger }}>
            <Text style={{ color: colors.danger, fontSize: typography.size.sm, fontWeight: '600' }}>{error}</Text>
          </View>
        )}
        <Button label={isPending ? 'Savingâ€¦' : 'Save record'} onPress={handleSave} />
        <View style={{ height: spacing(3) }} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
