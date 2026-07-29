import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useTheme } from '@microapps/core';

export interface CardProps extends ViewProps {
  children?: React.ReactNode;
}

/**
 * A themed surface container — see docs/UI_SYSTEM.md. Composition-first:
 * accepts arbitrary children rather than a fixed set of slot props, per
 * docs/COMPONENT_GUIDELINES.md's "composition over configuration
 * explosion."
 */
export function Card({ style, children, ...rest }: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.lg,
          padding: theme.spacing(4),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
