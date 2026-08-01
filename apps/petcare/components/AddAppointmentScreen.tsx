import { useTheme } from '@microapps/core';
import { Button, Screen, TextInput } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useAddAppointment } from '../lib/appointments';
import { cardShadow } from '../lib/styles';
import type { Appointment } from '../lib/types';
import { DatePicker } from './DatePicker';

const APPT_TYPES: { value: Appointment['appointmentType']; label: string; emoji: string }[] = [
  { value: 'vet', label: 'Vet', emoji: 'ðŸ¥' },
  { value: 'groomer', label: 'Groomer', emoji: 'âœ‚ï¸' },
  { value: 'other', label: 'Other', emoji: 'ðŸ“…' },
];

export function AddAppointmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { mutateAsync: addAppointment, isPending } = useAddAppointment();

  const [apptType, setApptType] = useState<Appointment['appointmentType']>('vet');
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    try {
      setError(null);
      if (!title.trim()) { setError('Title is required'); return; }
      if (!scheduledAt) { setError('Date is required'); return; }
      await addAppointment({
        petId: id,
        title: title.trim(),
        appointmentType: apptType,
        scheduledAt: new Date(scheduledAt + 'T09:00:00').toISOString(),
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch (e: unknown) {
      console.error('[AddAppointment] Failed to save:', e);
      setError('Failed to save appointment. Please try again.');
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing(6) }}>
          Add Appointment ðŸ“…
        </Text>

        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>Type</Text>
        <View style={{ flexDirection: 'row', gap: spacing(2), marginBottom: spacing(5) }}>
          {APPT_TYPES.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => setApptType(t.value)}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: spacing(3),
                borderRadius: radii.lg,
                borderWidth: 2,
                borderColor: apptType === t.value ? colors.primary : colors.border,
                backgroundColor: apptType === t.value ? colors.primary : colors.surface,
                alignItems: 'center',
                opacity: pressed ? 0.8 : 1,
                ...cardShadow,
              })}
            >
              <Text style={{ fontSize: 24 }}>{t.emoji}</Text>
              <Text style={{ fontSize: typography.size.sm, fontWeight: '700', color: apptType === t.value ? colors.primaryText : colors.text, marginTop: 2 }}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(4), ...cardShadow }}>
          <TextInput label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. Annual checkup" />
          <View style={{ height: spacing(4) }} />
          <DatePicker label="Date *" value={scheduledAt} onChange={setScheduledAt} placeholder="Select appointment date" />
          <View style={{ height: spacing(4) }} />
          <TextInput label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional notesâ€¦" />
        </View>

        {error && (
          <View style={{ backgroundColor: '#FFF3F3', borderRadius: radii.md, padding: spacing(3), marginBottom: spacing(3), borderLeftWidth: 4, borderLeftColor: colors.danger }}>
            <Text style={{ color: colors.danger, fontSize: typography.size.sm, fontWeight: '600' }}>{error}</Text>
          </View>
        )}
        <Button label={isPending ? 'Savingâ€¦' : 'Schedule appointment'} onPress={handleSave} />
        <View style={{ height: spacing(3) }} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
