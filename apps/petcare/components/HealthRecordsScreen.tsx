import { useTheme } from '@microapps/core';
import { EmptyState, ErrorState, Screen, Spinner } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { useDeleteHealthRecord, useHealthRecords } from '../lib/health';
import { usePet } from '../lib/pets';
import { cardShadow, formatDate, recordTypeEmoji } from '../lib/styles';
import type { HealthRecord } from '../lib/types';

const RECORD_TYPE_LABELS: Record<HealthRecord['recordType'], string> = {
  vet_visit: 'Vet Visit',
  vaccination: 'Vaccination',
  medication: 'Medication',
  note: 'Note',
};

const RECORD_TYPE_COLORS: Record<HealthRecord['recordType'], string> = {
  vet_visit: '#E3F2FD',
  vaccination: '#FCE4EC',
  medication: '#F3E5F5',
  note: '#F1F8E9',
};

export function HealthRecordsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { data: pet } = usePet(id);
  const { data: records, isLoading, error, refetch } = useHealthRecords(id);
  const { mutateAsync: deleteRecord } = useDeleteHealthRecord();

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message="Failed to load health records" />;

  function confirmDelete(r: HealthRecord) {
    Alert.alert('Delete record', `Remove "${r.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteRecord({ id: r.id, petId: id }); } },
    ]);
  }

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ backgroundColor: colors.primary, paddingTop: spacing(6), paddingBottom: spacing(4), paddingHorizontal: spacing(4) }}>
          <Pressable onPress={() => router.back()} style={{ marginBottom: spacing(3) }}>
            <Text style={{ color: colors.primaryText, fontSize: typography.size.md }}>← Back</Text>
          </Pressable>
          <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.primaryText }}>
            {pet?.name ?? 'Pet'}'s Health
          </Text>
          <Text style={{ fontSize: typography.size.sm, color: 'rgba(255,255,255,0.8)', marginTop: spacing(1) }}>
            {records?.length ?? 0} records
          </Text>
        </View>

        <View style={{ padding: spacing(4), flex: 1 }}>
          <Pressable
            onPress={() => router.push(`/pets/${id}/health/add`)}
            style={{ backgroundColor: colors.primary, borderRadius: radii.lg, padding: spacing(4), alignItems: 'center', marginBottom: spacing(4), ...cardShadow }}
          >
            <Text style={{ fontSize: typography.size.md, fontWeight: '700', color: colors.primaryText }}>+ Add Health Record</Text>
          </Pressable>

          {!records || records.length === 0 ? (
            <EmptyState title="No health records" message="Add vet visits, vaccinations, medications and notes." />
          ) : (
            <FlatList
              data={records}
              keyExtractor={(r) => r.id}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  onLongPress={() => confirmDelete(item)}
                  style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(3), ...cardShadow }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: RECORD_TYPE_COLORS[item.recordType], alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
                      <Text style={{ fontSize: 22 }}>{recordTypeEmoji(item.recordType)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <View style={{ backgroundColor: RECORD_TYPE_COLORS[item.recordType], borderRadius: 10, paddingHorizontal: spacing(2), paddingVertical: 2, marginRight: spacing(2) }}>
                          <Text style={{ fontSize: typography.size.xs, fontWeight: '700', color: colors.text }}>{RECORD_TYPE_LABELS[item.recordType]}</Text>
                        </View>
                        <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>{formatDate(item.recordDate)}</Text>
                      </View>
                      <Text style={{ fontSize: typography.size.md, fontWeight: '700', color: colors.text }}>{item.title}</Text>
                      {item.description ? (
                        <Text style={{ fontSize: typography.size.sm, color: colors.textMuted, marginTop: 4 }}>{item.description}</Text>
                      ) : null}
                      {item.vetName ? (
                        <Text style={{ fontSize: typography.size.xs, color: colors.textMuted, marginTop: 4 }}>👨‍⚕️ {item.vetName}</Text>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>
      </View>
    </Screen>
  );
}
