import { useTheme } from '@microapps/theme';
import { EmptyState, ErrorState, Screen, Spinner } from '@microapps/ui';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { useFeedings } from '../hooks/useFeedings';
import type { Feeding } from '../repository/FeedingRepository';

function FeedingRow({ feeding }: { feeding: Feeding }) {
  const { colors, typography, spacing, radii } = useTheme();
  const date = new Date(feeding.fedAt);
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        padding: spacing(3),
        marginBottom: spacing(2),
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text
        style={{
          fontSize: typography.size.md,
          fontWeight: '600',
          color: colors.text,
        }}
      >
        {feeding.foodType}
      </Text>
      <Text style={{ fontSize: typography.size.sm, color: colors.textMuted }}>
        {date.toLocaleDateString()} at{' '}
        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        {feeding.amountGrams ? ` · ${feeding.amountGrams}g` : ''}
      </Text>
    </View>
  );
}

export function FeedingLogScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const { data: feedings, isLoading, error } = useFeedings();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message="Failed to load feeding log" />;

  return (
    <Screen>
      <View style={{ padding: spacing(4), flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing(4),
          }}
        >
          <Text
            style={{
              fontSize: typography.size.xl,
              fontWeight: 'bold',
              color: colors.text,
            }}
          >
            Feedings
          </Text>
          <Pressable
            onPress={() => router.push('/feedings/add')}
            accessibilityRole="button"
            accessibilityLabel="Log feeding"
            style={{
              backgroundColor: colors.primary,
              borderRadius: 22,
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: colors.primaryText,
                fontSize: typography.size.xl,
                lineHeight: 24,
              }}
            >
              +
            </Text>
          </Pressable>
        </View>

        {feedings && feedings.length === 0 ? (
          <EmptyState
            title="No feedings logged"
            message="Tap + to log your first feeding."
          />
        ) : (
          <FlatList
            data={feedings}
            keyExtractor={(f) => f.id}
            renderItem={({ item }) => <FeedingRow feeding={item} />}
          />
        )}
      </View>
    </Screen>
  );
}
