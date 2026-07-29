import { useTheme } from '@microapps/core';
import { ErrorState, Spinner } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { useHealthRecords } from '../lib/health';
import { useDeletePet, usePet } from '../lib/pets';
import { cardShadow, formatDate, recordTypeEmoji, speciesEmoji, timeAgo } from '../lib/styles';
import { useWeights } from '../lib/weights';
import { useFeedingsForPet } from '../lib/feedings';

export function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { data: pet, isLoading, error } = usePet(id);
  const { data: feedings } = useFeedingsForPet(id);
  const { data: weights } = useWeights(id);
  const { data: healthRecords } = useHealthRecords(id);
  const { mutateAsync: deletePet } = useDeletePet();

  if (isLoading) return <Spinner />;
  if (error || !pet) return <ErrorState message="Pet not found" />;

  const recentFeedings = (feedings ?? []).slice(0, 3);
  const latestWeight = weights?.[0] ?? null;
  const latestHealth = healthRecords?.[0] ?? null;

  function ageLabel(): string {
    if (!pet!.birthDate) return 'Age unknown';
    const birth = new Date(pet!.birthDate);
    const months = Math.floor((Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    if (months < 12) return `${months}mo old`;
    return `${Math.floor(months / 12)}yr old`;
  }

  function confirmDelete() {
    Alert.alert('Delete pet', `Remove ${pet!.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deletePet(pet!.id);
          router.back();
        }
      },
    ]);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      {/* Hero header */}
      <View style={{ backgroundColor: colors.primary, paddingTop: spacing(6), paddingBottom: spacing(8), paddingHorizontal: spacing(4), alignItems: 'center' }}>
        <Pressable onPress={() => router.back()} style={{ position: 'absolute', top: spacing(4), left: spacing(4) }}>
          <Text style={{ color: colors.primaryText, fontSize: typography.size.md }}>← Back</Text>
        </Pressable>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing(3) }}>
          <Text style={{ fontSize: 44 }}>{speciesEmoji(pet.species)}</Text>
        </View>
        <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.primaryText }}>{pet.name}</Text>
        <Text style={{ fontSize: typography.size.md, color: 'rgba(255,255,255,0.8)', marginTop: spacing(1) }}>
          {pet.species}{pet.breed ? ` · ${pet.breed}` : ''}
        </Text>
      </View>

      <View style={{ padding: spacing(4), marginTop: -spacing(4) }}>
        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: spacing(3), marginBottom: spacing(5) }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(3), alignItems: 'center', ...cardShadow }}>
            <Text style={{ fontSize: typography.size.lg, fontWeight: '700', color: colors.primary }}>{ageLabel()}</Text>
            <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>Age</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(3), alignItems: 'center', ...cardShadow }}>
            <Text style={{ fontSize: typography.size.lg, fontWeight: '700', color: colors.primary }}>{feedings?.length ?? 0}</Text>
            <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>Feedings</Text>
          </View>
        </View>

        {/* Feeding section */}
        <SectionLabel label="Feedings" colors={colors} typography={typography} spacing={spacing} />
        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, marginBottom: spacing(4), overflow: 'hidden', ...cardShadow }}>
          {recentFeedings.length === 0 ? (
            <View style={{ padding: spacing(4) }}>
              <Text style={{ color: colors.textMuted, fontSize: typography.size.sm }}>No feedings logged yet</Text>
            </View>
          ) : (
            recentFeedings.map((f, i) => (
              <View key={f.id} style={{ padding: spacing(3), borderBottomWidth: i < recentFeedings.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: typography.size.sm, fontWeight: '600', color: colors.text }}>{f.foodType}</Text>
                <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>{timeAgo(f.fedAt)}{f.amountGrams ? ` · ${f.amountGrams}g` : ''}</Text>
              </View>
            ))
          )}
          <View style={{ flexDirection: 'row', borderTopWidth: recentFeedings.length > 0 ? 1 : 0, borderTopColor: colors.border }}>
            <Pressable
              onPress={() => router.push(`/feedings/add?petId=${pet.id}`)}
              style={{ flex: 1, padding: spacing(3), alignItems: 'center', backgroundColor: colors.primary }}
            >
              <Text style={{ fontSize: typography.size.sm, fontWeight: '700', color: colors.primaryText }}>+ Log Feeding</Text>
            </Pressable>
            {(feedings?.length ?? 0) > 3 && (
              <Pressable
                onPress={() => router.push(`/(tabs)/feeding`)}
                style={{ flex: 1, padding: spacing(3), alignItems: 'center' }}
              >
                <Text style={{ fontSize: typography.size.sm, color: colors.primary, fontWeight: '600' }}>View all →</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Weight section */}
        <SectionLabel label="Weight" colors={colors} typography={typography} spacing={spacing} />
        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, marginBottom: spacing(4), overflow: 'hidden', ...cardShadow }}>
          <View style={{ padding: spacing(3) }}>
            {latestWeight ? (
              <View>
                <Text style={{ fontSize: typography.size.lg, fontWeight: '700', color: colors.text }}>{latestWeight.weightKg} kg</Text>
                <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>{formatDate(latestWeight.measuredAt)}</Text>
              </View>
            ) : (
              <Text style={{ color: colors.textMuted, fontSize: typography.size.sm }}>No weight recorded yet</Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border }}>
            <Pressable
              onPress={() => router.push(`/pets/${pet.id}/weight`)}
              style={{ flex: 1, padding: spacing(3), alignItems: 'center' }}
            >
              <Text style={{ fontSize: typography.size.sm, color: colors.primary, fontWeight: '600' }}>Track Weight →</Text>
            </Pressable>
          </View>
        </View>

        {/* Health section */}
        <SectionLabel label="Health" colors={colors} typography={typography} spacing={spacing} />
        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, marginBottom: spacing(4), overflow: 'hidden', ...cardShadow }}>
          <View style={{ padding: spacing(3) }}>
            {latestHealth ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: spacing(2) }}>{recordTypeEmoji(latestHealth.recordType)}</Text>
                <View>
                  <Text style={{ fontSize: typography.size.sm, fontWeight: '600', color: colors.text }}>{latestHealth.title}</Text>
                  <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>{formatDate(latestHealth.recordDate)}</Text>
                </View>
              </View>
            ) : (
              <Text style={{ color: colors.textMuted, fontSize: typography.size.sm }}>No health records yet</Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border }}>
            <Pressable
              onPress={() => router.push(`/pets/${pet.id}/health`)}
              style={{ flex: 1, padding: spacing(3), alignItems: 'center' }}
            >
              <Text style={{ fontSize: typography.size.sm, color: colors.primary, fontWeight: '600' }}>View Records →</Text>
            </Pressable>
          </View>
        </View>

        {/* Edit & Delete */}
        <Pressable
          onPress={() => router.push(`/pets/${pet.id}/edit`)}
          style={{ backgroundColor: colors.primary, borderRadius: radii.lg, padding: spacing(4), alignItems: 'center', marginBottom: spacing(3), ...cardShadow }}
        >
          <Text style={{ fontSize: typography.size.md, fontWeight: '700', color: colors.primaryText }}>Edit Pet</Text>
        </Pressable>
        <Pressable
          onPress={confirmDelete}
          style={{ borderRadius: radii.lg, padding: spacing(4), alignItems: 'center', borderWidth: 1, borderColor: colors.danger }}
        >
          <Text style={{ fontSize: typography.size.md, fontWeight: '600', color: colors.danger }}>Delete Pet</Text>
        </Pressable>

        <View style={{ height: spacing(6) }} />
      </View>
    </ScrollView>
  );
}

function SectionLabel({ label, colors, typography, spacing }: {
  label: string;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
}) {
  return (
    <Text style={{ fontSize: typography.size.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>
      {label}
    </Text>
  );
}
