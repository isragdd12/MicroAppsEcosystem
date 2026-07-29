import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@microapps/core';

export interface SpinnerProps {
  size?: 'small' | 'large';
}

/** A themed loading indicator — see docs/UI_SYSTEM.md. */
export function Spinner({ size = 'small' }: SpinnerProps) {
  const theme = useTheme();

  return (
    <View accessibilityRole="progressbar">
      <ActivityIndicator size={size} color={theme.colors.primary} />
    </View>
  );
}
