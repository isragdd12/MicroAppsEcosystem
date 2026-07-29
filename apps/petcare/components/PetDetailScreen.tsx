import { useTheme } from '@microapps/core';
import { Button, Card, ErrorState, Screen, Spinner, Stack } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Image, Text, View } from 'react-native';

import { useDeletePet, usePet } from '../lib/pets';

export function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { data: pet, isLoading, error } = usePet(id);
  const { mutateAsync: deletePet } = useDeletePet();

  if (isLoading) return <Spinner />;
  if (error || !pet) return <ErrorState message="Pet not found" />;

  function confirmDelete() {
    Alert.alert('Delete pet', `Remove ${pet!.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deletePet(pet!.id); router.back(); } },
    ]);
  }

  return (
    <Screen>
      <Stack gap={4} style={{ padding: spacing(4) }}>
        <Button label="← Back" variant="ghost" onPress={() => router.back()} />
        {pet.photoUrl && (
          <Image source={{ uri: pet.photoUrl }} style={{ width: '100%', height: 220, borderRadius: radii.lg }} resizeMode="cover" />
        )}
        <Text style={{ fontSize: typography.size.xxl, fontWeight: 'bold', color: colors.text }}>{pet.name}</Text>
        <Card>
          <View style={{ gap: spacing(2) }}>
            <InfoRow label="Species" value={pet.species} />
            {pet.breed && <InfoRow label="Breed" value={pet.breed} />}
            {pet.birthDate && <InfoRow label="Birth date" value={pet.birthDate} />}
            {pet.notes && <InfoRow label="Notes" value={pet.notes} />}
          </View>
        </Card>
        <Button label="Edit" variant="secondary" onPress={() => router.push(`/pets/${pet.id}/edit`)} />
        <Button label="Log feeding" onPress={() => router.push(`/feedings/add?petId=${pet.id}`)} />
        <Button label="Delete" variant="ghost" onPress={confirmDelete} />
      </Stack>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors, typography } = useTheme();
  return (
    <View>
      <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>{label}</Text>
      <Text style={{ fontSize: typography.size.md, color: colors.text }}>{value}</Text>
    </View>
  );
}
