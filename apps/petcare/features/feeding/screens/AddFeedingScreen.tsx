import { useTheme } from '@microapps/theme';
import { Button, Screen, Stack, TextInput } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text } from 'react-native';

import { useLogFeeding } from '../hooks/useLogFeeding';

export function AddFeedingScreen() {
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const { mutateAsync: logFeeding, isPending } = useLogFeeding();

  const [targetPetId, setTargetPetId] = useState(petId ?? '');
  const [foodType, setFoodType] = useState('');
  const [amountGrams, setAmountGrams] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    try {
      setError(null);
      await logFeeding({
        petId: targetPetId,
        foodType,
        amountGrams: amountGrams ? parseFloat(amountGrams) : undefined,
        notes: notes || undefined,
        fedAt: new Date().toISOString(),
      });
      router.back();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to log feeding');
    }
  }

  return (
    <Screen>
      <Stack gap={4} style={{ padding: spacing(4) }}>
        <Text
          style={{
            fontSize: typography.size.xl,
            fontWeight: 'bold',
            color: colors.text,
          }}
        >
          Log Feeding
        </Text>
        {!petId && (
          <TextInput
            label="Pet ID *"
            value={targetPetId}
            onChangeText={setTargetPetId}
            placeholder="Paste pet ID or navigate from a pet"
          />
        )}
        <TextInput
          label="Food type *"
          value={foodType}
          onChangeText={setFoodType}
          placeholder="e.g. Dry kibble"
        />
        <TextInput
          label="Amount (grams)"
          value={amountGrams}
          onChangeText={setAmountGrams}
          placeholder="e.g. 150"
          keyboardType="decimal-pad"
        />
        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any notes…"
        />
        {error && (
          <Text style={{ color: colors.danger, fontSize: typography.size.sm }}>
            {error}
          </Text>
        )}
        <Button
          label={isPending ? 'Saving…' : 'Log feeding'}
          onPress={handleSave}
        />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </Stack>
    </Screen>
  );
}
