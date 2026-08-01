import { useTheme } from '@microapps/core';
import { EmptyState, Screen, Spinner } from '@microapps/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useDeleteExpense, useExpenses } from '../lib/expenses';
import { cardShadow, formatDate } from '../lib/styles';
import type { Expense } from '../lib/types';

const CAT_META: Record<Expense['category'], { emoji: string; color: string; bg: string }> = {
  food: { emoji: 'ðŸ½ï¸', color: '#E65100', bg: '#FFF3E0' },
  vet: { emoji: 'ðŸ¥', color: '#1565C0', bg: '#E3F2FD' },
  grooming: { emoji: 'âœ‚ï¸', color: '#6A1B9A', bg: '#F3E5F5' },
  toys: { emoji: 'ðŸŽ¾', color: '#2E7D32', bg: '#E8F5E9' },
  medicine: { emoji: 'ðŸ’Š', color: '#BF360C', bg: '#FBE9E7' },
  other: { emoji: 'ðŸ’°', color: '#37474F', bg: '#ECEFF1' },
};

export function ExpensesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();
  const { data: expenses, isLoading } = useExpenses(id);
  const { mutateAsync: deleteExpense } = useDeleteExpense();

  if (isLoading) return <Spinner />;

  const total = (expenses ?? []).reduce((s, e) => s + e.amount, 0);
  const currency = expenses?.[0]?.currency ?? 'USD';

  const byCategory = Object.entries(
    (expenses ?? []).reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(6) }}>
          <View>
            <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text }}>Expenses ðŸ’°</Text>
            <Text style={{ fontSize: typography.size.sm, color: colors.textMuted }}>{expenses?.length ?? 0} entries</Text>
          </View>
          <Pressable
            onPress={() => router.push(`/pets/${id}/expenses/add`)}
            style={{ backgroundColor: colors.primary, borderRadius: 24, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', ...cardShadow }}
          >
            <Text style={{ color: colors.primaryText, fontSize: 26 }}>+</Text>
          </Pressable>
        </View>

        {(expenses?.length ?? 0) > 0 && (
          <>
            <View style={{ backgroundColor: colors.primary, borderRadius: radii.lg, padding: spacing(5), marginBottom: spacing(5), alignItems: 'center', ...cardShadow }}>
              <Text style={{ fontSize: typography.size.xs, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>Total Spent</Text>
              <Text style={{ fontSize: 36, fontWeight: '800', color: colors.primaryText, marginTop: spacing(1) }}>
                {currency} {total.toFixed(2)}
              </Text>
            </View>

            {byCategory.length > 1 && (
              <>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>By Category</Text>
                <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, overflow: 'hidden', marginBottom: spacing(5), ...cardShadow }}>
                  {byCategory.map(([cat, amount], i) => {
                    const meta = CAT_META[cat as Expense['category']] ?? CAT_META.other;
                    const pct = Math.round((amount / total) * 100);
                    return (
                      <View key={cat} style={{ flexDirection: 'row', alignItems: 'center', padding: spacing(3), borderBottomWidth: i < byCategory.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: meta.bg, alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
                          <Text style={{ fontSize: 18 }}>{meta.emoji}</Text>
                        </View>
                        <Text style={{ flex: 1, fontSize: typography.size.sm, fontWeight: '600', color: colors.text, textTransform: 'capitalize' }}>{cat}</Text>
                        <Text style={{ fontSize: typography.size.xs, color: colors.textMuted, marginRight: spacing(2) }}>{pct}%</Text>
                        <Text style={{ fontSize: typography.size.sm, fontWeight: '700', color: meta.color }}>{currency} {amount.toFixed(2)}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>All Entries</Text>
          </>
        )}

        {!expenses || expenses.length === 0 ? (
          <EmptyState title="No expenses" message="Track your pet care spending here." />
        ) : (
          expenses.map((e) => {
            const meta = CAT_META[e.category] ?? CAT_META.other;
            return (
              <View key={e.id} style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(3), flexDirection: 'row', alignItems: 'center', ...cardShadow }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: meta.bg, alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
                  <Text style={{ fontSize: 22 }}>{meta.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: typography.size.md, fontWeight: '700', color: colors.text }}>{e.currency} {e.amount.toFixed(2)}</Text>
                  <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>{e.category} Â· {formatDate(e.expenseDate)}</Text>
                  {e.description && <Text style={{ fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 }}>{e.description}</Text>}
                </View>
                <Pressable
                  onPress={() => deleteExpense({ id: e.id, petId: id }).catch((err) => console.error('[Expenses] Delete failed:', err))}
                  style={{ padding: spacing(2) }}
                >
                  <Text style={{ color: colors.danger }}>âœ•</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
