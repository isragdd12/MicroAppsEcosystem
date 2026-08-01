import { useTheme } from '@microapps/core';
import { EmptyState, Screen, Spinner } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useDeleteMedication, useMedications, useToggleMedication } from '../lib/medications';
import { cardShadow, formatDate } from '../lib/styles';

export function MedicationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { data: meds, isLoading } = useMedications(id);
  const { mutateAsync: toggleMed } = useToggleMedication();
  const { mutateAsync: deleteMed } = useDeleteMedication();

  if (isLoading) return <Spinner />;

  const active = (meds ?? []).filter((m) => m.isActive);
  const past = (meds ?? []).filter((m) => !m.isActive);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(6) }}>
          <View>
            <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text }}>Medications ðŸ’Š</Text>
            <Text style={{ fontSize: typography.size.sm, color: colors.textMuted }}>{active.length} active</Text>
          </View>
          <Pressable
            onPress={() => router.push(`/pets/${id}/medications/add`)}
            style={{ backgroundColor: colors.primary, borderRadius: 24, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', ...cardShadow }}
          >
            <Text style={{ color: colors.primaryText, fontSize: 26 }}>+</Text>
          </Pressable>
        </View>

        {!meds || meds.length === 0 ? (
          <EmptyState title="No medications" message="Track your pet's medications here." />
        ) : (
          <>
            {active.length > 0 && (
              <>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>Active</Text>
                {active.map((m) => (
                  <MedCard key={m.id} med={m} onToggle={() => toggleMed({ id: m.id, isActive: false, petId: id }).catch((e) => console.error('[Meds] Toggle failed:', e))} onDelete={() => deleteMed({ id: m.id, petId: id }).catch((e) => console.error('[Meds] Delete failed:', e))} colors={colors} typography={typography} spacing={spacing} radii={radii} />
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2), marginTop: spacing(4) }}>Past</Text>
                {past.map((m) => (
                  <MedCard key={m.id} med={m} inactive onToggle={() => toggleMed({ id: m.id, isActive: true, petId: id }).catch((e) => console.error('[Meds] Toggle failed:', e))} onDelete={() => deleteMed({ id: m.id, petId: id }).catch((e) => console.error('[Meds] Delete failed:', e))} colors={colors} typography={typography} spacing={spacing} radii={radii} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function MedCard({ med, inactive, onToggle, onDelete, colors, typography, spacing, radii }: {
  med: { id: string; name: string; dosage: string | null; frequency: string | null; startDate: string; endDate: string | null; notes: string | null };
  inactive?: boolean;
  onToggle: () => void;
  onDelete: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radii: ReturnType<typeof useTheme>['radii'];
}) {
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(3), opacity: inactive ? 0.7 : 1, ...cardShadow }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: inactive ? colors.surfaceAlt : '#FFF3E0', alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
          <Text style={{ fontSize: 22 }}>ðŸ’Š</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: typography.size.md, fontWeight: '700', color: colors.text }}>{med.name}</Text>
          {med.dosage && <Text style={{ fontSize: typography.size.sm, color: colors.textMuted }}>Dose: {med.dosage}</Text>}
          {med.frequency && <Text style={{ fontSize: typography.size.sm, color: colors.textMuted }}>Frequency: {med.frequency}</Text>}
          <Text style={{ fontSize: typography.size.xs, color: colors.textMuted, marginTop: spacing(1) }}>
            Started {formatDate(med.startDate)}{med.endDate ? ` Â· Ends ${formatDate(med.endDate)}` : ''}
          </Text>
          {med.notes && <Text style={{ fontSize: typography.size.sm, color: colors.textMuted, marginTop: spacing(1) }}>{med.notes}</Text>}
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginTop: spacing(3), gap: spacing(2) }}>
        <Pressable
          onPress={onToggle}
          style={{ flex: 1, paddingVertical: spacing(2), borderRadius: radii.md, borderWidth: 1, borderColor: colors.primary, alignItems: 'center' }}
        >
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: typography.size.sm }}>
            {inactive ? 'Mark Active' : 'Mark Complete'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          style={{ paddingHorizontal: spacing(3), paddingVertical: spacing(2), borderRadius: radii.md, borderWidth: 1, borderColor: colors.danger, alignItems: 'center' }}
        >
          <Text style={{ color: colors.danger, fontSize: typography.size.sm }}>âœ•</Text>
        </Pressable>
      </View>
    </View>
  );
}
