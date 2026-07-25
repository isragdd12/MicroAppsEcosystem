import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@microapps/theme';
import type { Theme } from '@microapps/theme';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
}

function variantColor(theme: Theme, variant: ToastVariant): string {
  switch (variant) {
    case 'success':
      return theme.colors.success;
    case 'warning':
      return theme.colors.warning;
    case 'danger':
      return theme.colors.danger;
    case 'info':
      return theme.colors.info;
  }
}

/**
 * A themed inline notification banner — see docs/UI_SYSTEM.md. This
 * component renders the toast's visual content only; positioning it as
 * an overlay/queueing multiple toasts is an app-level concern (a small
 * Zustand store + a portal at the app root, per docs/STATE_MANAGEMENT.md)
 * layered on top of this primitive, not part of it.
 */
export function Toast({ message, variant = 'info' }: ToastProps) {
  const theme = useTheme();
  const color = variantColor(theme, variant);

  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceAlt,
        borderLeftWidth: 4,
        borderLeftColor: color,
        borderRadius: theme.radii.md,
        padding: theme.spacing(3),
      }}
    >
      <Text
        style={{ color: theme.colors.text, fontSize: theme.typography.size.sm }}
      >
        {message}
      </Text>
    </View>
  );
}
