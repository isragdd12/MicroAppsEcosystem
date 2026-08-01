import { useTheme } from '@microapps/core';
import { Button, Screen, TextInput } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useLogFeeding } from '../lib/feedings';
import { cardShadow } from '../lib/styles';
import { DatePicker } from './DatePicker';
import { PetSelector } from './PetSelector';
import type { Pet } from '../lib/types';

export function AddFeedingScreen() {
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { mutateAsync: logFeeding, isPending } = useLogFeeding();

  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [foodType, setFoodType] = useState('');
  const [amountGrams, setAmountGrams] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const targetPetId = petId ?? selectedPet?.id ?? '';

  async function handleSave() {
    try {
      setError(null);
      if (!targetPetId) { setError('Please select a pet'); return; }
      if (!foodType.trim()) { setError('Food type is required'); return; }
      const fedAt = date
        ? new Date(date + 'T12:00:00').toISOString()
        : new Date().toISOString();
      await logFeeding({
        petId: targetPetId,
        foodType: foodType.trim(),
        amountGrams: amountGrams ? parseFloat(amountGrams) : undefined,
        notes: notes.trim() || undefined,
        fedAt,
      });
      router.back();
    } catch (e: unknown) {
      console.error('[AddFeeding] Failed to log feeding:', e);
      setError('Failed to log feeding. Please try again.');
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing(6) }}>
          Log Feeding ðŸ½ï¸
        </Text>

        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(4), ...cardShadow }}>
          {!petId && (
            <>
              <PetSelector selectedPetId={selectedPet?.id ?? ''} onSelect={setSelectedPet} />
              <View style={{ height: spacing(4) }} />
            </>
          )}
          {petId && (
            <View style={{ marginBottom: spacing(4), padding: spacing(3), backgroundColor: colors.surfaceAlt, borderRadius: radii.md }}>
              <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>Logging for</Text>
              <Text style={{ fontSize: typography.size.md, fontWeight: '700', color: colors.text }}>{petId}</Text>
            </View>
          )}
          <TextInput
            label="Food type *"
            value={foodType}
            onChangeText={setFoodType}
            placeholder="e.g. Dry kibble, Wet food"
          />
          <View style={{ height: spacing(4) }} />
          <TextInput
            label="Amount (grams)"
            value={amountGrams}
            onChangeText={setAmountGrams}
            placeholder="e.g. 150"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(4), ...cardShadow }}>
          <DatePicker label="Date *" value={date} onChange={setDate} />
          <View style={{ height: spacing(4) }} />
          <TextInput label="Notes" value={notes} onChangeText={setNotes} placeholder="Any notesâ€¦" />
        </View>

        {error && (
          <View style={{ backgroundColor: '#FFF3F3', borderRadius: radii.md, padding: spacing(3), marginBottom: spacing(3), borderLeftWidth: 4, borderLeftColor: colors.danger }}>
            <Text style={{ color: colors.danger, fontSize: typography.size.sm, fontWeight: '600' }}>{error}</Text>
          </View>
        )}

        <Button label={isPending ? 'Savingâ€¦' : 'Log feeding'} onPress={handleSave} />
        <View style={{ height: spacing(3) }} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
