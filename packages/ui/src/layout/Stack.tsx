import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '@microapps/core';

export interface StackProps extends ViewProps {
  /** Gap between children, in theme spacing units (see docs/THEME_SYSTEM.md). */
  gap?: number;
  children?: React.ReactNode;
}

/**
 * Vertical layout primitive — see docs/UI_SYSTEM.md's layout components.
 * Configurable purely through props/theme; no domain knowledge.
 */
export function Stack({ gap = 0, style, children, ...rest }: StackProps) {
  const theme = useTheme();
  const gapStyle: ViewStyle = { gap: theme.spacing(gap) };

  return (
    <View style={[{ flexDirection: 'column' }, gapStyle, style]} {...rest}>
      {children}
    </View>
  );
}
