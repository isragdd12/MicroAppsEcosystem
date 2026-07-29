import { useTheme } from '@microapps/core';
import { EmptyState, ErrorState, Screen, Spinner } from '@microapps/ui';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { usePets } from '../lib/pets';
import type { Pet } from '../lib/types';

function PetCard({ pet, onPress }: { pet: Pet; onPress: () => void }) {
  const { colors, typography, spacing, radii } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${pet.name}`}
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        padding: spacing(4),
        marginBottom: spacing(3),
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ fontSize: typography.size.lg, fontWeight: 'bold', color: colors.text }}>
        {pet.name}
      </Text>
      <Text style={{ fontSize: typography.size.sm, color: colors.textMuted, marginTop: spacing(1) }}>
        {pet.species}{pet.breed ? ` · ${pet.breed}` : ''}
      </Text>
    </Pressable>
  );
}

export function PetsScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const { data: pets, isLoading, error } = usePets();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message="Failed to load pets" />;

  return (
    <Screen>
      <View style={{ padding: spacing(4), flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(4) }}>
          <Text style={{ fontSize: typography.size.xl, fontWeight: 'bold', color: colors.text }}>
            My Pets
          </Text>
          <Pressable
            onPress={() => router.push('/pets/add')}
            accessibilityRole="button"
            accessibilityLabel="Add pet"
            style={{ backgroundColor: colors.primary, borderRadius: 22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: colors.primaryText, fontSize: typography.size.xl, lineHeight: 24 }}>+</Text>
          </Pressable>
        </View>
        {!pets || pets.length === 0 ? (
          <EmptyState title="No pets yet" message="Tap + to add your first pet." />
        ) : (
          <FlatList
            data={pets}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => (
              <PetCard pet={item} onPress={() => router.push(`/pets/${item.id}`)} />
            )}
          />
        )}
      </View>
    </Screen>
  );
}
