import { useTheme } from '@microapps/core';
import { Button, Screen, TextInput } from '@microapps/ui';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useCreatePet } from '../lib/pets';
import { cardShadow } from '../lib/styles';

export function AddPetScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { mutateAsync: createPet, isPending } = useCreatePet();

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    try {
      setError(null);
      await createPet({ name, species, breed: breed || undefined, birthDate: birthDate || undefined, notes: notes || undefined });
      router.back();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save pet');
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing(5) }}>
          Add Pet
        </Text>

        <SectionCard colors={colors} radii={radii} spacing={spacing} title="Basic Info">
          <TextInput label="Name *" value={name} onChangeText={setName} placeholder="e.g. Buddy" />
          <View style={{ height: spacing(3) }} />
          <TextInput label="Species *" value={species} onChangeText={setSpecies} placeholder="e.g. Dog" />
          <View style={{ height: spacing(3) }} />
          <TextInput label="Breed" value={breed} onChangeText={setBreed} placeholder="e.g. Labrador" />
        </SectionCard>

        <SectionCard colors={colors} radii={radii} spacing={spacing} title="Details">
          <TextInput label="Birth date" value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" />
          <View style={{ height: spacing(3) }} />
          <TextInput label="Notes" value={notes} onChangeText={setNotes} placeholder="Any notes…" />
        </SectionCard>

        {error && (
          <Text style={{ color: colors.danger, fontSize: typography.size.sm, marginBottom: spacing(3) }}>{error}</Text>
        )}
        <Button label={isPending ? 'Saving…' : 'Save pet'} onPress={handleSave} />
        <View style={{ height: spacing(3) }} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

function SectionCard({ children, title, colors, radii, spacing }: {
  children: React.ReactNode;
  title: string;
  colors: ReturnType<typeof useTheme>['colors'];
  radii: ReturnType<typeof useTheme>['radii'];
  spacing: ReturnType<typeof useTheme>['spacing'];
}) {
  return (
    <View style={{ marginBottom: spacing(4) }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>{title}</Text>
      <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), ...cardShadow }}>
        {children}
      </View>
    </View>
  );
}
