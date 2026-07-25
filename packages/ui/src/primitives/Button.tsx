import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@microapps/theme';
import type { Theme } from '@microapps/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Accessible label override — defaults to `label` (see
   * docs/COMPONENT_GUIDELINES.md's accessibility checklist). */
  accessibilityLabel?: string;
}

const SIZE_PADDING: Record<
  ButtonSize,
  {
    vertical: number;
    horizontal: number;
    fontSize: keyof Theme['typography']['size'];
  }
> = {
  sm: { vertical: 1.5, horizontal: 3, fontSize: 'sm' },
  md: { vertical: 2.5, horizontal: 4, fontSize: 'md' },
  lg: { vertical: 3.5, horizontal: 5, fontSize: 'lg' },
};

function variantColors(theme: Theme, variant: ButtonVariant) {
  switch (variant) {
    case 'primary':
      return {
        background: theme.colors.primary,
        text: theme.colors.primaryText,
      };
    case 'secondary':
      return {
        background: theme.colors.secondary,
        text: theme.colors.secondaryText,
      };
    case 'danger':
      return {
        background: theme.colors.danger,
        text: theme.colors.primaryText,
      };
    case 'ghost':
      return { background: 'transparent', text: theme.colors.primary };
  }
}

/**
 * The one shared button component — every app's buttons render through
 * this, differing only via theme tokens and these props (variant/size),
 * per docs/UI_SYSTEM.md's "configuration surface" rule: no app-identity
 * conditionals are ever allowed inside this component.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const theme = useTheme();
  const colors = variantColors(theme, variant);
  const sizing = SIZE_PADDING[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        {
          backgroundColor: colors.background,
          paddingVertical: theme.spacing(sizing.vertical),
          paddingHorizontal: theme.spacing(sizing.horizontal),
          borderRadius: theme.radii.md,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text
          style={{
            color: colors.text,
            fontSize: theme.typography.size[sizing.fontSize],
            fontFamily: theme.typography.fontFamily.medium,
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
