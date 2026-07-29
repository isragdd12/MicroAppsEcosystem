import { useTheme } from '@microapps/core';
import { Button, Screen, TextInput } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { cardShadow } from '../lib/styles';
import { useAddWeight } from '../lib/weights';

export function AddWeightScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { mutateAsync: addWeight, isPending } = useAddWeight();

  const [weightKg, setWeightKg] = useState('');
  const [measuredAt, setMeasuredAt] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    try {
      setError(null);
      const kg = parseFloat(weightKg);
      if (isNaN(kg) || kg <= 0) throw new Error('Enter a valid weight');
      await addWeight({ petId: id, weightKg: kg, measuredAt, notes: notes || undefined });
      router.back();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing(5) }}>
          Add Measurement
        </Text>

        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(4), ...cardShadow }}>
          <TextInput
            label="Weight (kg) *"
            value={weightKg}
            onChangeText={setWeightKg}
            placeholder="e.g. 12.5"
            keyboardType="decimal-pad"
          />
          <View style={{ height: spacing(3) }} />
          <TextInput
            label="Date *"
            value={measuredAt}
            onChangeText={setMeasuredAt}
            placeholder="YYYY-MM-DD"
          />
          <View style={{ height: spacing(3) }} />
          <TextInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes…"
          />
        </View>

        {error && (
          <Text style={{ color: colors.danger, fontSize: typography.size.sm, marginBottom: spacing(3) }}>{error}</Text>
        )}
        <Button label={isPending ? 'Saving…' : 'Save measurement'} onPress={handleSave} />
        <View style={{ height: spacing(3) }} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
