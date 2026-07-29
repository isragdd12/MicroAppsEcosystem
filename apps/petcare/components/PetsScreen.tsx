import { useTheme } from '@microapps/core';
import { EmptyState, ErrorState, Screen, Spinner } from '@microapps/ui';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { useFeedings } from '../lib/feedings';
import { usePets } from '../lib/pets';
import { cardShadow, speciesEmoji, timeAgo } from '../lib/styles';
import type { Pet } from '../lib/types';

function PetCard({ pet, lastFedAt, onPress }: { pet: Pet; lastFedAt: string | null; onPress: () => void }) {
  const { colors, typography, spacing, radii } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${pet.name}`}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing(4),
        marginBottom: spacing(3),
        flexDirection: 'row',
        alignItems: 'center',
        opacity: pressed ? 0.85 : 1,
        ...cardShadow,
      })}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing(3),
        }}
      >
        <Text style={{ fontSize: 28 }}>{speciesEmoji(pet.species)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: typography.size.lg, fontWeight: '700', color: colors.text }}>{pet.name}</Text>
        <Text style={{ fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 }}>
          {pet.species}{pet.breed ? ` · ${pet.breed}` : ''}
        </Text>
        <Text style={{ fontSize: typography.size.xs, color: lastFedAt ? colors.success : colors.textMuted, marginTop: 4 }}>
          {lastFedAt ? `Last fed ${timeAgo(lastFedAt)}` : 'Not fed yet'}
        </Text>
      </View>
      <Text style={{ fontSize: 20, color: colors.textMuted }}>›</Text>
    </Pressable>
  );
}

export function PetsScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const { data: pets, isLoading, error, refetch } = usePets();
  const { data: feedings } = useFeedings();

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message="Failed to load pets" />;

  function lastFedAt(petId: string): string | null {
    if (!feedings) return null;
    const f = feedings.find((feeding) => feeding.petId === petId);
    return f ? f.fedAt : null;
  }

  return (
    <Screen>
      <View style={{ paddingHorizontal: spacing(4), paddingTop: spacing(4), flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(5) }}>
          <View>
            <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text }}>My Pets</Text>
            <Text style={{ fontSize: typography.size.sm, color: colors.textMuted }}>{pets?.length ?? 0} companions</Text>
          </View>
          <Pressable
            onPress={() => router.push('/pets/add')}
            accessibilityRole="button"
            accessibilityLabel="Add pet"
            style={{ backgroundColor: colors.primary, borderRadius: 24, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', ...cardShadow }}
          >
            <Text style={{ color: colors.primaryText, fontSize: 26, lineHeight: 28 }}>+</Text>
          </Pressable>
        </View>
        {!pets || pets.length === 0 ? (
          <EmptyState title="No pets yet" message="Tap + to add your first pet." />
        ) : (
          <FlatList
            data={pets}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => (
              <PetCard
                pet={item}
                lastFedAt={lastFedAt(item.id)}
                onPress={() => router.push(`/pets/${item.id}`)}
              />
            )}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}
