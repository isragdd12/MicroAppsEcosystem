import { useTheme } from '@microapps/core';
import { Button, Screen, TextInput } from '@microapps/ui';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useCreatePet } from '../lib/pets';
import { cardShadow } from '../lib/styles';
import { DatePicker } from './DatePicker';

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Rabbit', 'Bird', 'Fish', 'Hamster', 'Other'];
const SPECIES_EMOJIS: Record<string, string> = {
  Dog: 'ðŸ•', Cat: 'ðŸˆ', Rabbit: 'ðŸ‡', Bird: 'ðŸ¦œ', Fish: 'ðŸ ', Hamster: 'ðŸ¹', Other: 'ðŸ¾',
};

export function AddPetScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { mutateAsync: createPet, isPending } = useCreatePet();

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [customSpecies, setCustomSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const finalSpecies = species === 'Other' ? customSpecies : species;

  async function handleSave() {
    try {
      setError(null);
      if (!name.trim()) { setError('Name is required'); return; }
      if (!finalSpecies.trim()) { setError('Species is required'); return; }
      await createPet({
        name: name.trim(),
        species: finalSpecies.trim(),
        breed: breed.trim() || undefined,
        birthDate: birthDate || undefined,
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch (e: unknown) {
      console.error('[AddPet] Failed to create pet:', e);
      setError('Failed to save pet. Please try again.');
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing(6) }}>
          Add Pet ðŸ¾
        </Text>

        {/* Name */}
        <SectionCard title="Basic Info" colors={colors} radii={radii} spacing={spacing}>
          <TextInput label="Name *" value={name} onChangeText={setName} placeholder="e.g. Buddy" />
          <View style={{ height: spacing(4) }} />
          <TextInput label="Breed" value={breed} onChangeText={setBreed} placeholder="e.g. Labrador" />
        </SectionCard>

        {/* Species picker */}
        <SectionCard title="Species" colors={colors} radii={radii} spacing={spacing}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) }}>
            {SPECIES_OPTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={() => setSpecies(s)}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing(3),
                  paddingVertical: spacing(2),
                  borderRadius: radii.lg,
                  borderWidth: 2,
                  borderColor: species === s ? colors.primary : colors.border,
                  backgroundColor: species === s ? colors.primary : colors.surface,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing(1),
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ fontSize: 16 }}>{SPECIES_EMOJIS[s]}</Text>
                <Text style={{
                  fontSize: typography.size.sm,
                  fontWeight: '600',
                  color: species === s ? colors.primaryText : colors.text,
                }}>{s}</Text>
              </Pressable>
            ))}
          </View>
          {species === 'Other' && (
            <View style={{ marginTop: spacing(3) }}>
              <TextInput
                label="Species name *"
                value={customSpecies}
                onChangeText={setCustomSpecies}
                placeholder="e.g. Guinea pig"
              />
            </View>
          )}
        </SectionCard>

        {/* Details */}
        <SectionCard title="Details" colors={colors} radii={radii} spacing={spacing}>
          <DatePicker label="Birth date" value={birthDate} onChange={setBirthDate} placeholder="Optional" />
          <View style={{ height: spacing(4) }} />
          <TextInput label="Notes" value={notes} onChangeText={setNotes} placeholder="Any notes about your petâ€¦" />
        </SectionCard>

        {error && (
          <View style={{ backgroundColor: '#FFF3F3', borderRadius: radii.md, padding: spacing(3), marginBottom: spacing(3), borderLeftWidth: 4, borderLeftColor: colors.danger }}>
            <Text style={{ color: colors.danger, fontSize: typography.size.sm, fontWeight: '600' }}>{error}</Text>
          </View>
        )}

        <Button label={isPending ? 'Savingâ€¦' : 'Save pet'} onPress={handleSave} />
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
