import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '@microapps/theme';

export interface RowProps extends ViewProps {
  /** Gap between children, in theme spacing units (see docs/THEME_SYSTEM.md). */
  gap?: number;
  /** Vertical alignment of children within the row. */
  align?: ViewStyle['alignItems'];
  /** Horizontal distribution of children within the row. */
  justify?: ViewStyle['justifyContent'];
  children?: React.ReactNode;
}

/**
 * Horizontal layout primitive — see docs/UI_SYSTEM.md's layout components.
 */
export function Row({
  gap = 0,
  align,
  justify,
  style,
  children,
  ...rest
}: RowProps) {
  const theme = useTheme();
  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    gap: theme.spacing(gap),
    alignItems: align,
    justifyContent: justify,
  };

  return (
    <View style={[rowStyle, style]} {...rest}>
      {children}
    </View>
  );
}
