import { useTheme } from '@microapps/core';
import { EmptyState, Screen, Spinner } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useDeleteGrooming, useGrooming } from '../lib/grooming';
import { cardShadow, formatDate, timeAgo } from '../lib/styles';
import type { GroomingLog } from '../lib/types';

const GROOMING_LABELS: Record<GroomingLog['groomingType'], { label: string; emoji: string }> = {
  bath: { label: 'Bath', emoji: 'ðŸ›' },
  haircut: { label: 'Haircut', emoji: 'âœ‚ï¸' },
  nail_trim: { label: 'Nail Trim', emoji: 'ðŸ’…' },
  brushing: { label: 'Brushing', emoji: 'ðŸª®' },
  ear_cleaning: { label: 'Ear Cleaning', emoji: 'ðŸ‘‚' },
  other: { label: 'Other', emoji: 'ðŸ¾' },
};

export function GroomingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { data: logs, isLoading } = useGrooming(id);
  const { mutateAsync: deleteGrooming } = useDeleteGrooming();

  if (isLoading) return <Spinner />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(6) }}>
          <View>
            <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text }}>Grooming âœ‚ï¸</Text>
            <Text style={{ fontSize: typography.size.sm, color: colors.textMuted }}>{logs?.length ?? 0} sessions</Text>
          </View>
          <Pressable
            onPress={() => router.push(`/pets/${id}/grooming/add`)}
            style={{ backgroundColor: colors.primary, borderRadius: 24, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', ...cardShadow }}
          >
            <Text style={{ color: colors.primaryText, fontSize: 26 }}>+</Text>
          </Pressable>
        </View>

        {!logs || logs.length === 0 ? (
          <EmptyState title="No grooming sessions" message="Log your first grooming session." />
        ) : (
          logs.map((log) => {
            const meta = GROOMING_LABELS[log.groomingType] ?? GROOMING_LABELS.other;
            return (
              <View key={log.id} style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(3), flexDirection: 'row', alignItems: 'center', ...cardShadow }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
                  <Text style={{ fontSize: 24 }}>{meta.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: typography.size.md, fontWeight: '700', color: colors.text }}>{meta.label}</Text>
                  <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>{timeAgo(log.groomedAt)} Â· {formatDate(log.groomedAt)}</Text>
                  {log.notes && <Text style={{ fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 }}>{log.notes}</Text>}
                </View>
                <Pressable
                  onPress={async () => {
                    try { await deleteGrooming({ id: log.id, petId: id }); }
                    catch (e) { console.error('[Grooming] Delete failed:', e); }
                  }}
                  style={{ padding: spacing(2) }}
                >
                  <Text style={{ color: colors.danger }}>âœ•</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
