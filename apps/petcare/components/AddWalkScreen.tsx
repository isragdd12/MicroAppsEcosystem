import { useTheme } from '@microapps/core';
import { Button, Screen, TextInput } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { cardShadow } from '../lib/styles';
import { useAddWalk } from '../lib/walks';
import { DatePicker } from './DatePicker';

export function AddWalkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { mutateAsync: addWalk, isPending } = useAddWalk();

  const [durationMinutes, setDurationMinutes] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [routeNotes, setRouteNotes] = useState('');
  const [walkedAt, setWalkedAt] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    try {
      setError(null);
      const dur = durationMinutes ? parseInt(durationMinutes) : undefined;
      const dist = distanceKm ? parseFloat(distanceKm) : undefined;
      if (!dur && !dist) { setError('Enter at least duration or distance'); return; }
      await addWalk({
        petId: id,
        durationMinutes: dur,
        distanceKm: dist,
        routeNotes: routeNotes.trim() || undefined,
        walkedAt: new Date(walkedAt + 'T12:00:00').toISOString(),
      });
      router.back();
    } catch (e: unknown) {
      console.error('[AddWalk] Failed to save walk:', e);
      setError('Failed to save walk. Please try again.');
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing(6) }}>
          Log Walk ðŸ¦®
        </Text>

        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(4), ...cardShadow }}>
          <TextInput
            label="Duration (minutes)"
            value={durationMinutes}
            onChangeText={setDurationMinutes}
            placeholder="e.g. 30"
            keyboardType="number-pad"
          />
          <View style={{ height: spacing(4) }} />
          <TextInput
            label="Distance (km)"
            value={distanceKm}
            onChangeText={setDistanceKm}
            placeholder="e.g. 2.5"
            keyboardType="decimal-pad"
          />
          <View style={{ height: spacing(4) }} />
          <DatePicker label="Date *" value={walkedAt} onChange={setWalkedAt} />
          <View style={{ height: spacing(4) }} />
          <TextInput
            label="Route / Notes"
            value={routeNotes}
            onChangeText={setRouteNotes}
            placeholder="e.g. Park loop"
          />
        </View>

        {error && (
          <View style={{ backgroundColor: '#FFF3F3', borderRadius: radii.md, padding: spacing(3), marginBottom: spacing(3), borderLeftWidth: 4, borderLeftColor: colors.danger }}>
            <Text style={{ color: colors.danger, fontSize: typography.size.sm, fontWeight: '600' }}>{error}</Text>
          </View>
        )}
        <Button label={isPending ? 'Savingâ€¦' : 'Save walk'} onPress={handleSave} />
        <View style={{ height: spacing(3) }} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
