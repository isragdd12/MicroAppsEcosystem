import { useTheme } from '@microapps/core';
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';

import { usePets } from '../lib/pets';
import { cardShadow, speciesEmoji } from '../lib/styles';
import type { Pet } from '../lib/types';

interface PetSelectorProps {
  label?: string;
  selectedPetId: string;
  onSelect: (pet: Pet) => void;
}

export function PetSelector({ label = 'Pet', selectedPetId, onSelect }: PetSelectorProps) {
  const { colors, typography, spacing, radii } = useTheme();
  const { data: pets } = usePets();
  const [open, setOpen] = useState(false);

  const selected = pets?.find((p) => p.id === selectedPetId);

  return (
    <>
      <View>
        <Text style={{ fontSize: typography.size.xs, fontWeight: '600', color: colors.textMuted, marginBottom: spacing(1) }}>
          {label}
        </Text>
        <Pressable
          onPress={() => setOpen(true)}
          style={({ pressed }) => ({
            height: 48,
            borderRadius: radii.md,
            borderWidth: 1.5,
            borderColor: selected ? colors.primary : colors.border,
            backgroundColor: colors.surface,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing(3),
            opacity: pressed ? 0.7 : 1,
            ...cardShadow,
          })}
        >
          {selected ? (
            <>
              <Text style={{ fontSize: 18, marginRight: spacing(2) }}>{speciesEmoji(selected.species)}</Text>
              <Text style={{ fontSize: typography.size.md, color: colors.text, flex: 1, fontWeight: '600' }}>{selected.name}</Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 18, marginRight: spacing(2) }}>🐾</Text>
              <Text style={{ fontSize: typography.size.md, color: colors.textMuted, flex: 1 }}>Select a pet…</Text>
            </>
          )}
          <Text style={{ fontSize: typography.size.sm, color: colors.textMuted }}>▼</Text>
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: spacing(2),
              paddingBottom: spacing(8),
              maxHeight: '70%',
            }}
          >
            {/* Handle */}
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing(4) }} />

            <Text style={{
              fontSize: typography.size.lg,
              fontWeight: '800',
              color: colors.text,
              paddingHorizontal: spacing(4),
              marginBottom: spacing(3),
            }}>
              Select Pet
            </Text>

            {(!pets || pets.length === 0) ? (
              <View style={{ padding: spacing(6), alignItems: 'center' }}>
                <Text style={{ fontSize: 40, marginBottom: spacing(3) }}>🐾</Text>
                <Text style={{ color: colors.textMuted, fontSize: typography.size.md, textAlign: 'center' }}>
                  No pets yet. Add a pet first.
                </Text>
              </View>
            ) : (
              <FlatList
                data={pets}
                keyExtractor={(p) => p.id}
                contentContainerStyle={{ paddingHorizontal: spacing(4) }}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => { onSelect(item); setOpen(false); }}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: spacing(4),
                      borderRadius: radii.lg,
                      marginBottom: spacing(2),
                      backgroundColor: item.id === selectedPetId ? colors.primary : colors.surface,
                      opacity: pressed ? 0.8 : 1,
                      ...cardShadow,
                    })}
                  >
                    <View style={{
                      width: 44, height: 44, borderRadius: 22,
                      backgroundColor: item.id === selectedPetId ? 'rgba(255,255,255,0.2)' : colors.surfaceAlt,
                      alignItems: 'center', justifyContent: 'center', marginRight: spacing(3),
                    }}>
                      <Text style={{ fontSize: 22 }}>{speciesEmoji(item.species)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: typography.size.md,
                        fontWeight: '700',
                        color: item.id === selectedPetId ? colors.primaryText : colors.text,
                      }}>{item.name}</Text>
                      <Text style={{
                        fontSize: typography.size.xs,
                        color: item.id === selectedPetId ? 'rgba(255,255,255,0.7)' : colors.textMuted,
                      }}>{item.species}{item.breed ? ` · ${item.breed}` : ''}</Text>
                    </View>
                    {item.id === selectedPetId && (
                      <Text style={{ color: colors.primaryText, fontSize: 20 }}>✓</Text>
                    )}
                  </Pressable>
                )}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
