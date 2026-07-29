import React from 'react';
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@microapps/core';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  /** Rendered before the title/subtitle — e.g. an avatar or icon. */
  leading?: React.ReactNode;
  /** Rendered after the title/subtitle — e.g. a chevron or badge. */
  trailing?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * A single row within a List — see docs/UI_SYSTEM.md. `leading`/
 * `trailing` slots let feature code compose a domain-specific row (e.g.
 * a PetCard's avatar + status chip) without ListItem knowing what a
 * "pet" or "status" is, per the composition-over-configuration rule in
 * docs/COMPONENT_GUIDELINES.md.
 */
export function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  style,
}: ListItemProps) {
  const theme = useTheme();
  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? title : undefined}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: theme.spacing(3),
          paddingHorizontal: theme.spacing(4),
          gap: theme.spacing(3),
          minHeight: 44,
          backgroundColor: theme.colors.surface,
        },
        style,
      ]}
    >
      {leading}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.size.md,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              color: theme.colors.textMuted,
              fontSize: theme.typography.size.sm,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </Container>
  );
}
