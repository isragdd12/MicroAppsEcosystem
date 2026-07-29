import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@microapps/core';

import { Button } from '../primitives/Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/**
 * Shown when a screen (or a scoped section of one, e.g. an AI insights
 * panel) fails to load — see docs/ERROR_HANDLING.md's non-blocking
 * treatment for sync/AI errors. Never a full-screen takeover by default;
 * it's the feature's choice whether to render this inline or full-bleed.
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing(6),
        gap: theme.spacing(3),
      }}
    >
      <Text
        style={{
          color: theme.colors.danger,
          fontSize: theme.typography.size.md,
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
      {onRetry ? (
        <Button label="Retry" onPress={onRetry} variant="secondary" />
      ) : null}
    </View>
  );
}
