import React from 'react';
import {
  TextInput as RNTextInput,
  View,
  Text,
  type TextInputProps as RNTextInputProps,
} from 'react-native';
import { useTheme } from '@microapps/theme';

export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  /** Validation/error message — see docs/COMPONENT_GUIDELINES.md and
   * docs/ERROR_HANDLING.md's "Validation error" category. */
  error?: string;
}

/**
 * The shared text input primitive — wraps React Native's TextInput with
 * theme-driven styling, an optional label, and an optional error message.
 * Form-level validation wiring (React Hook Form + Zod, per
 * docs/TECH_STACK.md) happens above this component, via packages/ui's
 * FormField wrapper — this component itself has no validation logic.
 */
export function TextInput({ label, error, ...rest }: TextInputProps) {
  const theme = useTheme();

  return (
    <View>
      {label ? (
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.size.sm,
            marginBottom: theme.spacing(1),
          }}
        >
          {label}
        </Text>
      ) : null}
      <RNTextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.textMuted}
        style={{
          borderWidth: 1,
          borderColor: error ? theme.colors.danger : theme.colors.border,
          borderRadius: theme.radii.md,
          paddingVertical: theme.spacing(2.5),
          paddingHorizontal: theme.spacing(3),
          minHeight: 44,
          fontSize: theme.typography.size.md,
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
        }}
        {...rest}
      />
      {error ? (
        <Text
          style={{
            color: theme.colors.danger,
            fontSize: theme.typography.size.xs,
            marginTop: theme.spacing(1),
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
