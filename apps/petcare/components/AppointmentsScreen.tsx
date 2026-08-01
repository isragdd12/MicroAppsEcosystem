import { useTheme } from '@microapps/core';
import { EmptyState, Screen, Spinner } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useAppointments, useCompleteAppointment, useDeleteAppointment } from '../lib/appointments';
import { cardShadow, formatDate } from '../lib/styles';
import type { Appointment } from '../lib/types';

const TYPE_META: Record<Appointment['appointmentType'], { emoji: string; color: string; bg: string }> = {
  vet: { emoji: 'ðŸ¥', color: '#1565C0', bg: '#E3F2FD' },
  groomer: { emoji: 'âœ‚ï¸', color: '#6A1B9A', bg: '#F3E5F5' },
  other: { emoji: 'ðŸ“…', color: '#4CAF50', bg: '#E8F5E9' },
};

export function AppointmentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { data: appts, isLoading } = useAppointments(id);
  const { mutateAsync: completeAppt } = useCompleteAppointment();
  const { mutateAsync: deleteAppt } = useDeleteAppointment();

  if (isLoading) return <Spinner />;

  const upcoming = (appts ?? []).filter((a) => !a.isCompleted && new Date(a.scheduledAt) >= new Date());
  const past = (appts ?? []).filter((a) => a.isCompleted || new Date(a.scheduledAt) < new Date());

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(6) }}>
          <View>
            <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text }}>Appointments ðŸ“…</Text>
            <Text style={{ fontSize: typography.size.sm, color: colors.textMuted }}>{upcoming.length} upcoming</Text>
          </View>
          <Pressable
            onPress={() => router.push(`/pets/${id}/appointments/add`)}
            style={{ backgroundColor: colors.primary, borderRadius: 24, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', ...cardShadow }}
          >
            <Text style={{ color: colors.primaryText, fontSize: 26 }}>+</Text>
          </Pressable>
        </View>

        {!appts || appts.length === 0 ? (
          <EmptyState title="No appointments" message="Schedule your pet's next appointment." />
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>Upcoming</Text>
                {upcoming.map((a) => {
                  const meta = TYPE_META[a.appointmentType];
                  return (
                    <View key={a.id} style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(3), ...cardShadow }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: meta.bg, alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
                          <Text style={{ fontSize: 24 }}>{meta.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: typography.size.md, fontWeight: '700', color: colors.text }}>{a.title}</Text>
                          <Text style={{ fontSize: typography.size.sm, fontWeight: '600', color: meta.color }}>{formatDate(a.scheduledAt)}</Text>
                          {a.notes && <Text style={{ fontSize: typography.size.xs, color: colors.textMuted, marginTop: 2 }}>{a.notes}</Text>}
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', marginTop: spacing(3), gap: spacing(2) }}>
                        <Pressable
                          onPress={() => completeAppt({ id: a.id, petId: id }).catch((e) => console.error('[Appointments] Complete failed:', e))}
                          style={{ flex: 1, paddingVertical: spacing(2), borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center' }}
                        >
                          <Text style={{ color: colors.primaryText, fontWeight: '700', fontSize: typography.size.sm }}>Mark Complete</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => deleteAppt({ id: a.id, petId: id }).catch((e) => console.error('[Appointments] Delete failed:', e))}
                          style={{ paddingHorizontal: spacing(3), paddingVertical: spacing(2), borderRadius: radii.md, borderWidth: 1, borderColor: colors.danger, alignItems: 'center' }}
                        >
                          <Text style={{ color: colors.danger, fontSize: typography.size.sm }}>âœ•</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2), marginTop: spacing(4) }}>Past</Text>
                {past.map((a) => {
                  const meta = TYPE_META[a.appointmentType];
                  return (
                    <View key={a.id} style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(3), opacity: 0.7, ...cardShadow }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, marginRight: spacing(2) }}>{a.isCompleted ? 'âœ…' : meta.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: typography.size.sm, fontWeight: '700', color: colors.text }}>{a.title}</Text>
                          <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>{formatDate(a.scheduledAt)}</Text>
                        </View>
                        <Pressable onPress={() => deleteAppt({ id: a.id, petId: id }).catch((e) => console.error('[Appointments] Delete failed:', e))}>
                          <Text style={{ color: colors.danger, fontSize: typography.size.sm }}>âœ•</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
