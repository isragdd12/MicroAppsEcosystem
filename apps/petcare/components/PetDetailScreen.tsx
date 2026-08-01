import { useTheme } from '@microapps/core';
import { ErrorState, Spinner } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { useHealthRecords } from '../lib/health';
import { useDeletePet, usePet } from '../lib/pets';
import { cardShadow, formatDate, recordTypeEmoji, speciesEmoji, timeAgo } from '../lib/styles';
import { useWeights } from '../lib/weights';
import { useFeedingsForPet } from '../lib/feedings';
import { useWalks } from '../lib/walks';
import { useMedications } from '../lib/medications';
import { useAppointments } from '../lib/appointments';

async function confirmDestructive(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return window.confirm(`${title}\n\n${message}`);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { data: pet, isLoading, error } = usePet(id);
  const { data: feedings } = useFeedingsForPet(id);
  const { data: weights } = useWeights(id);
  const { data: healthRecords } = useHealthRecords(id);
  const { data: walks } = useWalks(id);
  const { data: meds } = useMedications(id);
  const { data: appointments } = useAppointments(id);
  const { mutateAsync: deletePet, isPending: isDeleting } = useDeletePet();

  if (isLoading) return <Spinner />;
  if (error || !pet) return <ErrorState message="Pet not found" />;

  const recentFeedings = (feedings ?? []).slice(0, 3);
  const latestWeight = weights?.[0] ?? null;
  const latestHealth = healthRecords?.[0] ?? null;
  const activeMeds = (meds ?? []).filter((m) => m.isActive);
  const upcomingAppts = (appointments ?? []).filter((a) => !a.isCompleted && new Date(a.scheduledAt) > new Date()).slice(0, 2);

  function ageLabel(): string {
    if (!pet!.birthDate) return 'Unknown';
    const birth = new Date(pet!.birthDate);
    const months = Math.floor((Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    if (months < 1) return 'Newborn';
    if (months < 12) return `${months}mo`;
    return `${Math.floor(months / 12)}yr`;
  }

  function birthdayIn(): string | null {
    if (!pet!.birthDate) return null;
    const birth = new Date(pet!.birthDate);
    const now = new Date();
    const next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
    if (next < now) next.setFullYear(now.getFullYear() + 1);
    const days = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'ðŸŽ‚ Birthday today!';
    if (days <= 7) return `ðŸŽ‚ Birthday in ${days}d`;
    return null;
  }

  async function handleDelete() {
    const confirmed = await confirmDestructive('Delete pet', `Remove ${pet!.name}? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await deletePet(pet!.id);
      router.back();
    } catch (e: unknown) {
      console.error('[PetDetail] Failed to delete pet:', e);
    }
  }

  const birthday = birthdayIn();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={{ backgroundColor: colors.primary, paddingTop: spacing(6), paddingBottom: spacing(8), paddingHorizontal: spacing(4), alignItems: 'center' }}>
        <Pressable onPress={() => router.back()} style={{ position: 'absolute', top: spacing(4), left: spacing(4), padding: spacing(2) }}>
          <Text style={{ color: colors.primaryText, fontSize: typography.size.md, fontWeight: '600' }}>â† Back</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/pets/${pet.id}/edit`)}
          style={{ position: 'absolute', top: spacing(4), right: spacing(4), padding: spacing(2) }}
        >
          <Text style={{ color: colors.primaryText, fontSize: typography.size.sm, fontWeight: '600' }}>Edit</Text>
        </Pressable>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing(3) }}>
          <Text style={{ fontSize: 48 }}>{speciesEmoji(pet.species)}</Text>
        </View>
        <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.primaryText }}>{pet.name}</Text>
        <Text style={{ fontSize: typography.size.md, color: 'rgba(255,255,255,0.8)', marginTop: spacing(1) }}>
          {pet.species}{pet.breed ? ` Â· ${pet.breed}` : ''}
        </Text>
        {birthday && (
          <View style={{ marginTop: spacing(2), backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radii.full, paddingHorizontal: spacing(3), paddingVertical: spacing(1) }}>
            <Text style={{ color: colors.primaryText, fontSize: typography.size.sm, fontWeight: '700' }}>{birthday}</Text>
          </View>
        )}
      </View>

      <View style={{ padding: spacing(4), marginTop: -spacing(4) }}>
        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: spacing(2), marginBottom: spacing(5) }}>
          <StatCard value={ageLabel()} label="Age" color={colors.primary} colors={colors} typography={typography} spacing={spacing} radii={radii} />
          <StatCard value={String(feedings?.length ?? 0)} label="Feedings" color="#FF9800" colors={colors} typography={typography} spacing={spacing} radii={radii} />
          <StatCard value={String(walks?.length ?? 0)} label="Walks" color="#2196F3" colors={colors} typography={typography} spacing={spacing} radii={radii} />
          <StatCard value={String(activeMeds.length)} label="Meds" color="#E91E63" colors={colors} typography={typography} spacing={spacing} radii={radii} />
        </View>

        {/* Upcoming appointments */}
        {upcomingAppts.length > 0 && (
          <>
            <SectionLabel label="Upcoming" colors={colors} typography={typography} spacing={spacing} />
            <View style={{ backgroundColor: '#E3F2FD', borderRadius: radii.lg, padding: spacing(3), marginBottom: spacing(4), borderLeftWidth: 4, borderLeftColor: '#2196F3' }}>
              {upcomingAppts.map((a) => (
                <View key={a.id} style={{ marginBottom: spacing(1) }}>
                  <Text style={{ fontSize: typography.size.sm, fontWeight: '700', color: '#1565C0' }}>
                    {a.appointmentType === 'vet' ? 'ðŸ¥' : a.appointmentType === 'groomer' ? 'âœ‚ï¸' : 'ðŸ“…'} {a.title}
                  </Text>
                  <Text style={{ fontSize: typography.size.xs, color: '#1976D2' }}>{formatDate(a.scheduledAt)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Active medications alert */}
        {activeMeds.length > 0 && (
          <>
            <SectionLabel label="Active Medications" colors={colors} typography={typography} spacing={spacing} />
            <View style={{ backgroundColor: '#FFF8E1', borderRadius: radii.lg, padding: spacing(3), marginBottom: spacing(4), borderLeftWidth: 4, borderLeftColor: '#FF9800' }}>
              {activeMeds.slice(0, 2).map((m) => (
                <Text key={m.id} style={{ fontSize: typography.size.sm, color: '#E65100', fontWeight: '600' }}>
                  ðŸ’Š {m.name}{m.dosage ? ` Â· ${m.dosage}` : ''}
                </Text>
              ))}
              {activeMeds.length > 2 && (
                <Text style={{ fontSize: typography.size.xs, color: '#E65100', marginTop: spacing(1) }}>+{activeMeds.length - 2} more</Text>
              )}
            </View>
          </>
        )}

        {/* Feedings */}
        <SectionLabel label="Feedings" colors={colors} typography={typography} spacing={spacing} />
        <FeatureCard colors={colors} radii={radii} spacing={spacing} typography={typography}>
          {recentFeedings.length === 0 ? (
            <EmptyRow text="No feedings logged yet" colors={colors} typography={typography} spacing={spacing} />
          ) : (
            recentFeedings.map((f, i) => (
              <ItemRow
                key={f.id}
                primary={f.foodType}
                secondary={`${timeAgo(f.fedAt)}${f.amountGrams ? ` Â· ${f.amountGrams}g` : ''}`}
                last={i === recentFeedings.length - 1}
                colors={colors}
                typography={typography}
                spacing={spacing}
              />
            ))
          )}
          <ActionRow colors={colors} typography={typography} spacing={spacing}>
            <ActionButton label="+ Log Feeding" primary onPress={() => router.push(`/feedings/add?petId=${pet.id}`)} colors={colors} typography={typography} spacing={spacing} radii={radii} />
            {(feedings?.length ?? 0) > 3 && (
              <ActionButton label="View all â†’" onPress={() => router.push(`/(tabs)/feeding`)} colors={colors} typography={typography} spacing={spacing} radii={radii} />
            )}
          </ActionRow>
        </FeatureCard>

        {/* Weight */}
        <SectionLabel label="Weight" colors={colors} typography={typography} spacing={spacing} />
        <FeatureCard colors={colors} radii={radii} spacing={spacing} typography={typography}>
          {latestWeight ? (
            <View style={{ padding: spacing(3) }}>
              <Text style={{ fontSize: typography.size.xl, fontWeight: '800', color: colors.text }}>{latestWeight.weightKg} kg</Text>
              <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>{formatDate(latestWeight.measuredAt)}</Text>
            </View>
          ) : (
            <EmptyRow text="No weight recorded yet" colors={colors} typography={typography} spacing={spacing} />
          )}
          <ActionRow colors={colors} typography={typography} spacing={spacing}>
            <ActionButton label="Track Weight â†’" onPress={() => router.push(`/pets/${pet.id}/weight`)} colors={colors} typography={typography} spacing={spacing} radii={radii} />
          </ActionRow>
        </FeatureCard>

        {/* Walks */}
        <SectionLabel label="Walks" colors={colors} typography={typography} spacing={spacing} />
        <FeatureCard colors={colors} radii={radii} spacing={spacing} typography={typography}>
          {(walks?.length ?? 0) === 0 ? (
            <EmptyRow text="No walks logged yet" colors={colors} typography={typography} spacing={spacing} />
          ) : (
            <View style={{ padding: spacing(3) }}>
              <Text style={{ fontSize: typography.size.xl, fontWeight: '800', color: colors.text }}>{walks!.length}</Text>
              <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>walks this session</Text>
            </View>
          )}
          <ActionRow colors={colors} typography={typography} spacing={spacing}>
            <ActionButton label="+ Log Walk" primary onPress={() => router.push(`/pets/${pet.id}/walks/add`)} colors={colors} typography={typography} spacing={spacing} radii={radii} />
            {(walks?.length ?? 0) > 0 && <ActionButton label="View all â†’" onPress={() => router.push(`/pets/${pet.id}/walks`)} colors={colors} typography={typography} spacing={spacing} radii={radii} />}
          </ActionRow>
        </FeatureCard>

        {/* Health */}
        <SectionLabel label="Health Records" colors={colors} typography={typography} spacing={spacing} />
        <FeatureCard colors={colors} radii={radii} spacing={spacing} typography={typography}>
          {latestHealth ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing(3) }}>
              <Text style={{ fontSize: 22, marginRight: spacing(2) }}>{recordTypeEmoji(latestHealth.recordType)}</Text>
              <View>
                <Text style={{ fontSize: typography.size.sm, fontWeight: '700', color: colors.text }}>{latestHealth.title}</Text>
                <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>{formatDate(latestHealth.recordDate)}</Text>
              </View>
            </View>
          ) : (
            <EmptyRow text="No health records yet" colors={colors} typography={typography} spacing={spacing} />
          )}
          <ActionRow colors={colors} typography={typography} spacing={spacing}>
            <ActionButton label="View Records â†’" onPress={() => router.push(`/pets/${pet.id}/health`)} colors={colors} typography={typography} spacing={spacing} radii={radii} />
          </ActionRow>
        </FeatureCard>

        {/* More features grid */}
        <SectionLabel label="More" colors={colors} typography={typography} spacing={spacing} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginBottom: spacing(5) }}>
          {[
            { emoji: 'âœ‚ï¸', label: 'Grooming', route: `/pets/${pet.id}/grooming` },
            { emoji: 'ðŸ’Š', label: 'Medications', route: `/pets/${pet.id}/medications` },
            { emoji: 'ðŸ“…', label: 'Appointments', route: `/pets/${pet.id}/appointments` },
            { emoji: 'ðŸ’°', label: 'Expenses', route: `/pets/${pet.id}/expenses` },
          ].map((item) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.route as never)}
              style={({ pressed }) => ({
                flex: 1,
                minWidth: '45%',
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                padding: spacing(4),
                alignItems: 'center',
                opacity: pressed ? 0.7 : 1,
                ...cardShadow,
              })}
            >
              <Text style={{ fontSize: 28, marginBottom: spacing(1) }}>{item.emoji}</Text>
              <Text style={{ fontSize: typography.size.sm, fontWeight: '700', color: colors.text }}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Delete */}
        <Pressable
          onPress={handleDelete}
          disabled={isDeleting}
          style={({ pressed }) => ({
            borderRadius: radii.lg,
            padding: spacing(4),
            alignItems: 'center',
            borderWidth: 1.5,
            borderColor: colors.danger,
            opacity: pressed || isDeleting ? 0.6 : 1,
            marginBottom: spacing(2),
          })}
        >
          <Text style={{ fontSize: typography.size.md, fontWeight: '600', color: colors.danger }}>
            {isDeleting ? 'Deletingâ€¦' : 'Delete Pet'}
          </Text>
        </Pressable>

        <View style={{ height: spacing(6) }} />
      </View>
    </ScrollView>
  );
}

function StatCard({ value, label, color, colors, typography, spacing, radii }: {
  value: string; label: string; color: string;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radii: ReturnType<typeof useTheme>['radii'];
}) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(2), alignItems: 'center', ...cardShadow }}>
      <Text style={{ fontSize: typography.size.lg, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 10, color: colors.textMuted, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

function SectionLabel({ label, colors, typography, spacing }: {
  label: string;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
}) {
  return (
    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>
      {label}
    </Text>
  );
}

function FeatureCard({ children, colors, radii, spacing }: {
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>['colors'];
  radii: ReturnType<typeof useTheme>['radii'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  typography: ReturnType<typeof useTheme>['typography'];
}) {
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, marginBottom: spacing(4), overflow: 'hidden', ...cardShadow }}>
      {children}
    </View>
  );
}

function EmptyRow({ text, colors, typography, spacing }: {
  text: string;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
}) {
  return (
    <View style={{ padding: spacing(4) }}>
      <Text style={{ color: colors.textMuted, fontSize: typography.size.sm }}>{text}</Text>
    </View>
  );
}

function ItemRow({ primary, secondary, last, colors, typography, spacing }: {
  primary: string;
  secondary: string;
  last: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
}) {
  return (
    <View style={{ padding: spacing(3), borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border }}>
      <Text style={{ fontSize: typography.size.sm, fontWeight: '600', color: colors.text }}>{primary}</Text>
      <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>{secondary}</Text>
    </View>
  );
}

function ActionRow({ children, colors, spacing }: {
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
}) {
  return (
    <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border }}>
      {children}
    </View>
  );
}

function ActionButton({ label, primary, onPress, colors, typography, spacing, radii }: {
  label: string;
  primary?: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radii: ReturnType<typeof useTheme>['radii'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        padding: spacing(3),
        alignItems: 'center',
        backgroundColor: primary ? colors.primary : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ fontSize: typography.size.sm, fontWeight: '700', color: primary ? colors.primaryText : colors.primary }}>
        {label}
      </Text>
    </Pressable>
  );
}
