import { useTheme } from '@microapps/core';
import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color }) => <Text style={{ color }}>🏠</Text> }} />
      <Tabs.Screen name="index" options={{ title: 'Pets', tabBarIcon: ({ color }) => <Text style={{ color }}>🐾</Text> }} />
      <Tabs.Screen name="feeding" options={{ title: 'Feeding', tabBarIcon: ({ color }) => <Text style={{ color }}>🍽️</Text> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Text style={{ color }}>⚙️</Text> }} />
    </Tabs>
  );
}
