import { useAuth } from '@microapps/core';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { usePlayerProfile } from '../lib/player';

export default function Index() {
  const { session, status } = useAuth();
  const authLoading = status === 'loading';
  const { data: profile, isLoading: profileLoading } = usePlayerProfile();

  if (authLoading || (session && profileLoading)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FBF5E6' }}>
        <ActivityIndicator size="large" color="#D4A017" />
      </View>
    );
  }

  if (!session) return <Redirect href="/auth" />;
  if (!profile?.onboardingCompleted) return <Redirect href="/onboarding/step1" />;
  return <Redirect href="/(tabs)" />;
}
