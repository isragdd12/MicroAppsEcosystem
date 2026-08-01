import { AuthProvider, ThemeProvider } from '@microapps/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import { queryClient } from '../config/queryClient';
import { supabase } from '../config/supabase';
import { baseballLightTheme } from '../theme';

export default function RootLayout() {
  return (
    <ThemeProvider theme={baseballLightTheme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider client={supabase}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
