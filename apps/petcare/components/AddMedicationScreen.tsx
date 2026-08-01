import { useTheme } from '@microapps/core';
import { Button, Screen, TextInput } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useAddMedication } from '../lib/medications';
import { cardShadow } from '../lib/styles';
import { DatePicker } from './DatePicker';

export function AddMedicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { mutateAsync: addMedication, isPending } = useAddMedication();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    try {
      setError(null);
      if (!name.trim()) { setError('Medication name is required'); return; }
      await addMedication({
        petId: id,
        name: name.trim(),
        dosage: dosage.trim() || undefined,
        frequency: frequency.trim() || undefined,
        startDate,
        endDate: endDate || undefined,
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch (e: unknown) {
      console.error('[AddMedication] Failed to save:', e);
      setError('Failed to save medication. Please try again.');
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing(6) }}>
          Add Medication ðŸ’Š
        </Text>

        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(4), ...cardShadow }}>
          <TextInput label="Medication name *" value={name} onChangeText={setName} placeholder="e.g. Heartgard" />
          <View style={{ height: spacing(4) }} />
          <TextInput label="Dosage" value={dosage} onChangeText={setDosage} placeholder="e.g. 1 tablet" />
          <View style={{ height: spacing(4) }} />
          <TextInput label="Frequency" value={frequency} onChangeText={setFrequency} placeholder="e.g. Once daily" />
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(4), ...cardShadow }}>
          <DatePicker label="Start date *" value={startDate} onChange={setStartDate} />
          <View style={{ height: spacing(4) }} />
          <DatePicker label="End date (optional)" value={endDate} onChange={setEndDate} placeholder="No end date" />
          <View style={{ height: spacing(4) }} />
          <TextInput label="Notes" value={notes} onChangeText={setNotes} placeholder="Any notesâ€¦" />
        </View>

        {error && (
          <View style={{ backgroundColor: '#FFF3F3', borderRadius: radii.md, padding: spacing(3), marginBottom: spacing(3), borderLeftWidth: 4, borderLeftColor: colors.danger }}>
            <Text style={{ color: colors.danger, fontSize: typography.size.sm, fontWeight: '600' }}>{error}</Text>
          </View>
        )}
        <Button label={isPending ? 'Savingâ€¦' : 'Add medication'} onPress={handleSave} />
        <View style={{ height: spacing(3) }} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
