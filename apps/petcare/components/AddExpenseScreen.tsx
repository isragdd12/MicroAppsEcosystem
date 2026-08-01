import { useTheme } from '@microapps/core';
import { Button, Screen, TextInput } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useAddExpense } from '../lib/expenses';
import { cardShadow } from '../lib/styles';
import type { Expense } from '../lib/types';
import { DatePicker } from './DatePicker';

const CATEGORIES: { value: Expense['category']; label: string; emoji: string }[] = [
  { value: 'food', label: 'Food', emoji: 'ðŸ½ï¸' },
  { value: 'vet', label: 'Vet', emoji: 'ðŸ¥' },
  { value: 'grooming', label: 'Grooming', emoji: 'âœ‚ï¸' },
  { value: 'toys', label: 'Toys', emoji: 'ðŸŽ¾' },
  { value: 'medicine', label: 'Medicine', emoji: 'ðŸ’Š' },
  { value: 'other', label: 'Other', emoji: 'ðŸ’°' },
];

export function AddExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { mutateAsync: addExpense, isPending } = useAddExpense();

  const [category, setCategory] = useState<Expense['category']>('food');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    try {
      setError(null);
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount'); return; }
      await addExpense({
        petId: id,
        category,
        amount: amt,
        description: description.trim() || undefined,
        expenseDate,
      });
      router.back();
    } catch (e: unknown) {
      console.error('[AddExpense] Failed to save:', e);
      setError('Failed to save expense. Please try again.');
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing(6) }}>
          Log Expense ðŸ’°
        </Text>

        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginBottom: spacing(5) }}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.value}
              onPress={() => setCategory(c.value)}
              style={({ pressed }) => ({
                paddingHorizontal: spacing(3),
                paddingVertical: spacing(2),
                borderRadius: radii.lg,
                borderWidth: 2,
                borderColor: category === c.value ? colors.primary : colors.border,
                backgroundColor: category === c.value ? colors.primary : colors.surface,
                flexDirection: 'row', alignItems: 'center', gap: spacing(1),
                opacity: pressed ? 0.8 : 1,
                ...cardShadow,
              })}
            >
              <Text style={{ fontSize: 18 }}>{c.emoji}</Text>
              <Text style={{ fontSize: typography.size.sm, fontWeight: '700', color: category === c.value ? colors.primaryText : colors.text }}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(4), ...cardShadow }}>
          <TextInput label="Amount *" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />
          <View style={{ height: spacing(4) }} />
          <DatePicker label="Date *" value={expenseDate} onChange={setExpenseDate} />
          <View style={{ height: spacing(4) }} />
          <TextInput label="Description" value={description} onChangeText={setDescription} placeholder="What was this for?" />
        </View>

        {error && (
          <View style={{ backgroundColor: '#FFF3F3', borderRadius: radii.md, padding: spacing(3), marginBottom: spacing(3), borderLeftWidth: 4, borderLeftColor: colors.danger }}>
            <Text style={{ color: colors.danger, fontSize: typography.size.sm, fontWeight: '600' }}>{error}</Text>
          </View>
        )}
        <Button label={isPending ? 'Savingâ€¦' : 'Save expense'} onPress={handleSave} />
        <View style={{ height: spacing(3) }} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
