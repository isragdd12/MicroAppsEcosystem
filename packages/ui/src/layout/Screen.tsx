import React from 'react';
import { SafeAreaView, ScrollView, View, type ViewStyle } from 'react-native';
import { useTheme } from '@microapps/theme';

export interface ScreenProps {
  /** Wraps children in a ScrollView — off by default for screens that
   * manage their own scrolling (e.g. a FlatList-based list screen). */
  scroll?: boolean;
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * The standard screen wrapper every app screen renders inside — see
 * docs/UI_SYSTEM.md's layout components. Applies safe-area insets and
 * the theme's background color; does not know about navigation or any
 * domain content.
 *
 * NOTE: uses React Native's built-in SafeAreaView for now. Real apps
 * (from Milestone 4 onward) should prefer `react-native-safe-area-
 * context`'s provider-based API for more accurate insets — swapping the
 * implementation here does not change this component's public props.
 */
export function Screen({ scroll = false, children, style }: ScreenProps) {
  const theme = useTheme();
  const backgroundStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
  };

  const Container = scroll ? ScrollView : View;

  return (
    <SafeAreaView style={backgroundStyle}>
      <Container
        style={scroll ? undefined : [{ flex: 1 }, style]}
        contentContainerStyle={scroll ? style : undefined}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}
