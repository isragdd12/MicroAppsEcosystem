import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@microapps/theme';

import { Button } from '../primitives/Button';

export interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Feature-supplied illustration/icon — see docs/UI_SYSTEM.md's icon
   * convention (referenced by the feature via theme.icons, not imported
   * directly by this shared component). */
  icon?: React.ReactNode;
}

/**
 * Shown when a screen has no data yet (e.g. the Pets list before any pet
 * is added — see docs/COMPONENT_GUIDELINES.md's whole-screen-reuse
 * example). Generic: takes copy and an optional action as props, no
 * domain knowledge of what's empty.
 */
export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing(6),
        gap: theme.spacing(3),
      }}
    >
      {icon}
      <Text
        style={{
          color: theme.colors.text,
          fontSize: theme.typography.size.lg,
          fontFamily: theme.typography.fontFamily.medium,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      {message ? (
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: theme.typography.size.sm,
            textAlign: 'center',
          }}
        >
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="primary" />
      ) : null}
    </View>
  );
}
