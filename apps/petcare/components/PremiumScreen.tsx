import { useTheme } from '@microapps/core';
import { Screen, Stack } from '@microapps/ui';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

export function PremiumScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <Stack gap={4} style={{ padding: spacing(4) }}>
        <Text style={{ fontSize: typography.size.xl, fontWeight: 'bold', color: colors.text }}>
          Premium
        </Text>
        <Text style={{ fontSize: typography.size.md, color: colors.textMuted }}>
          Premium features coming soon.
        </Text>
      </Stack>
    </Screen>
  );
}
