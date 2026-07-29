import { AuthProvider, ThemeProvider } from '@microapps/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { useColorScheme } from 'react-native';

import { queryClient } from '../config/queryClient';
import { supabase } from '../config/supabase';
import { petcareDarkTheme, petcareLightTheme } from '../theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? petcareDarkTheme : petcareLightTheme;

  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider client={supabase}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
