import { useTheme } from '@microapps/theme';
import {
  Button,
  ErrorState,
  Screen,
  Spinner,
  Stack,
  TextInput,
} from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { usePet } from '../hooks/usePet';
import { useUpdatePet } from '../hooks/useUpdatePet';

export function EditPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const { data: pet, isLoading, error } = usePet(id);
  const { mutateAsync: updatePet, isPending } = useUpdatePet();

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (pet) {
      setName(pet.name);
      setSpecies(pet.species);
      setBreed(pet.breed ?? '');
      setBirthDate(pet.birthDate ?? '');
      setNotes(pet.notes ?? '');
    }
  }, [pet]);

  if (isLoading) return <Spinner />;
  if (error || !pet) return <ErrorState message="Pet not found" />;

  async function handleSave() {
    try {
      setSaveError(null);
      await updatePet({
        id,
        patch: {
          name,
          species,
          breed: breed || undefined,
          birthDate: birthDate || undefined,
          notes: notes || undefined,
        },
      });
      router.back();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save');
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
          Edit {pet.name}
        </Text>
        <TextInput label="Name *" value={name} onChangeText={setName} />
        <TextInput
          label="Species *"
          value={species}
          onChangeText={setSpecies}
        />
        <TextInput label="Breed" value={breed} onChangeText={setBreed} />
        <TextInput
          label="Birth date"
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="YYYY-MM-DD"
        />
        <TextInput label="Notes" value={notes} onChangeText={setNotes} />
        {saveError && (
          <Text style={{ color: colors.danger, fontSize: typography.size.sm }}>
            {saveError}
          </Text>
        )}
        <Button
          label={isPending ? 'Saving…' : 'Save changes'}
          onPress={handleSave}
        />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </Stack>
    </Screen>
  );
}
