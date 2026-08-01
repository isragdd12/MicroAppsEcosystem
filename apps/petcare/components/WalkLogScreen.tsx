import { useTheme } from '@microapps/core';
import { EmptyState, Screen, Spinner } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useDeleteWalk, useWalks } from '../lib/walks';
import { cardShadow, formatDate, timeAgo } from '../lib/styles';

export function WalkLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { data: walks, isLoading } = useWalks(id);
  const { mutateAsync: deleteWalk } = useDeleteWalk();

  const totalDistance = (walks ?? []).reduce((s, w) => s + (w.distanceKm ?? 0), 0);
  const totalMinutes = (walks ?? []).reduce((s, w) => s + (w.durationMinutes ?? 0), 0);

  if (isLoading) return <Spinner />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(6) }}>
          <View>
            <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text }}>Walk Log ðŸ¦®</Text>
            <Text style={{ fontSize: typography.size.sm, color: colors.textMuted }}>{walks?.length ?? 0} walks recorded</Text>
          </View>
          <Pressable
            onPress={() => router.push(`/pets/${id}/walks/add`)}
            style={{ backgroundColor: colors.primary, borderRadius: 24, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', ...cardShadow }}
          >
            <Text style={{ color: colors.primaryText, fontSize: 26 }}>+</Text>
          </Pressable>
        </View>

        {/* Summary */}
        {(walks?.length ?? 0) > 0 && (
          <View style={{ flexDirection: 'row', gap: spacing(3), marginBottom: spacing(5) }}>
            <View style={{ flex: 1, backgroundColor: '#E3F2FD', borderRadius: radii.lg, padding: spacing(3), alignItems: 'center' }}>
              <Text style={{ fontSize: typography.size.xl, fontWeight: '800', color: '#1565C0' }}>{totalDistance.toFixed(1)}</Text>
              <Text style={{ fontSize: typography.size.xs, color: '#1976D2' }}>km total</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#E8F5E9', borderRadius: radii.lg, padding: spacing(3), alignItems: 'center' }}>
              <Text style={{ fontSize: typography.size.xl, fontWeight: '800', color: '#2E7D32' }}>{totalMinutes}</Text>
              <Text style={{ fontSize: typography.size.xs, color: '#388E3C' }}>min total</Text>
            </View>
          </View>
        )}

        {!walks || walks.length === 0 ? (
          <EmptyState title="No walks yet" message="Log your first walk to start tracking!" />
        ) : (
          walks.map((w) => (
            <View key={w.id} style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(3), ...cardShadow }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: typography.size.md, fontWeight: '700', color: colors.text }}>
                    {w.durationMinutes ? `${w.durationMinutes} min` : 'Walk'}{w.distanceKm ? ` Â· ${w.distanceKm.toFixed(1)} km` : ''}
                  </Text>
                  <Text style={{ fontSize: typography.size.xs, color: colors.textMuted, marginTop: 2 }}>{timeAgo(w.walkedAt)} Â· {formatDate(w.walkedAt)}</Text>
                  {w.routeNotes && (
                    <Text style={{ fontSize: typography.size.sm, color: colors.textMuted, marginTop: spacing(1) }}>{w.routeNotes}</Text>
                  )}
                </View>
                <Pressable
                  onPress={async () => {
                    try { await deleteWalk({ id: w.id, petId: id }); }
                    catch (e) { console.error('[WalkLog] Delete failed:', e); }
                  }}
                  style={{ padding: spacing(2) }}
                >
                  <Text style={{ color: colors.danger, fontSize: typography.size.sm }}>âœ•</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
