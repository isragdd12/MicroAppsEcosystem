import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@microapps/core';

export interface SpacerProps {
  /** Size in theme spacing units (see docs/THEME_SYSTEM.md). */
  size?: number;
  /** 'vertical' adds height (for use inside a Stack), 'horizontal' adds
   * width (for use inside a Row). */
  direction?: 'vertical' | 'horizontal';
}

/** A fixed-size gap — an explicit alternative to a Stack/Row's `gap` prop
 * for one-off spacing between two specific elements. */
export function Spacer({ size = 1, direction = 'vertical' }: SpacerProps) {
  const theme = useTheme();
  const amount = theme.spacing(size);

  return (
    <View
      style={direction === 'vertical' ? { height: amount } : { width: amount }}
    />
  );
}
