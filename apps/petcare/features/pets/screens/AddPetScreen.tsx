import { useTheme } from '@microapps/theme';
import { Button, Screen, Stack, TextInput } from '@microapps/ui';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text } from 'react-native';

import { useCreatePet } from '../hooks/useCreatePet';

export function AddPetScreen() {
  const { colors, typography, spacing } = useTheme();
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
      await createPet({
        name,
        species,
        breed: breed || undefined,
        birthDate: birthDate || undefined,
        notes: notes || undefined,
      });
      router.back();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save pet');
    }
  }

  return (
    <Screen>
      <Stack gap={4} style={{ padding: spacing(4) }}>
        <Text
          style={{
            fontSize: typography.size.xl,
            fontWeight: 'bold',
            color: colors.text,
          }}
        >
          Add Pet
        </Text>
        <TextInput
          label="Name *"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Buddy"
        />
        <TextInput
          label="Species *"
          value={species}
          onChangeText={setSpecies}
          placeholder="e.g. Dog"
        />
        <TextInput
          label="Breed"
          value={breed}
          onChangeText={setBreed}
          placeholder="e.g. Labrador"
        />
        <TextInput
          label="Birth date"
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="YYYY-MM-DD"
        />
        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any notes…"
        />
        {error && (
          <Text style={{ color: colors.danger, fontSize: typography.size.sm }}>
            {error}
          </Text>
        )}
        <Button
          label={isPending ? 'Saving…' : 'Save pet'}
          onPress={handleSave}
        />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </Stack>
    </Screen>
  );
}
