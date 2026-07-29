import { useTheme } from '@microapps/core';
import { Button, Screen, TextInput } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useAddHealthRecord } from '../lib/health';
import { cardShadow } from '../lib/styles';
import type { HealthRecord } from '../lib/types';

const RECORD_TYPES: { value: HealthRecord['recordType']; label: string; emoji: string }[] = [
  { value: 'vet_visit', label: 'Vet Visit', emoji: '🏥' },
  { value: 'vaccination', label: 'Vaccination', emoji: '💉' },
  { value: 'medication', label: 'Medication', emoji: '💊' },
  { value: 'note', label: 'Note', emoji: '📝' },
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
      if (!title.trim()) throw new Error('Title is required');
      await addRecord({
        petId: id,
        recordType,
        title: title.trim(),
        description: description || undefined,
        recordDate,
        vetName: vetName || undefined,
      });
      router.back();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing(5) }}>
          Add Health Record
        </Text>

        {/* Record type selector */}
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>
          Record Type
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginBottom: spacing(4) }}>
          {RECORD_TYPES.map((rt) => (
            <Pressable
              key={rt.value}
              onPress={() => setRecordType(rt.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: spacing(3),
                paddingVertical: spacing(2),
                borderRadius: radii.lg,
                borderWidth: 2,
                borderColor: recordType === rt.value ? colors.primary : colors.border,
                backgroundColor: recordType === rt.value ? colors.primary : colors.surface,
                ...cardShadow,
              }}
            >
              <Text style={{ fontSize: 16, marginRight: spacing(1) }}>{rt.emoji}</Text>
              <Text style={{ fontSize: typography.size.sm, fontWeight: '600', color: recordType === rt.value ? colors.primaryText : colors.text }}>
                {rt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Form fields */}
        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(4), ...cardShadow }}>
          <TextInput label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. Annual checkup" />
          <View style={{ height: spacing(3) }} />
          <TextInput label="Description" value={description} onChangeText={setDescription} placeholder="Optional details…" />
          <View style={{ height: spacing(3) }} />
          <TextInput label="Date *" value={recordDate} onChangeText={setRecordDate} placeholder="YYYY-MM-DD" />
          {(recordType === 'vet_visit' || recordType === 'vaccination') && (
            <>
              <View style={{ height: spacing(3) }} />
              <TextInput label="Vet name" value={vetName} onChangeText={setVetName} placeholder="e.g. Dr. Smith" />
            </>
          )}
        </View>

        {error && (
          <Text style={{ color: colors.danger, fontSize: typography.size.sm, marginBottom: spacing(3) }}>{error}</Text>
        )}
        <Button label={isPending ? 'Saving…' : 'Save record'} onPress={handleSave} />
        <View style={{ height: spacing(3) }} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
