import { useAuth, useTheme } from '@microapps/core';
import { Screen } from '@microapps/ui';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { cardShadow } from '../lib/styles';

export function SettingsScreen() {
  const { status, session, signOut } = useAuth();
  const { colors, typography, spacing, radii } = useTheme();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace('/auth/sign-in');
  }

  const email = session?.user.email ?? '';
  const initial = email.charAt(0).toUpperCase() || '?';

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: typography.size.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing(5) }}>Settings</Text>

        {/* Profile card */}
        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(4), flexDirection: 'row', alignItems: 'center', ...cardShadow }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
            <Text style={{ fontSize: typography.size.xl, fontWeight: '800', color: colors.primaryText }}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: typography.size.md, fontWeight: '700', color: colors.text }}>
              {status === 'signed-in' ? 'Signed in' : 'Not signed in'}
            </Text>
            {email ? (
              <Text style={{ fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 }}>{email}</Text>
            ) : (
              <Text style={{ fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 }}>Data stored locally only</Text>
            )}
          </View>
        </View>

        {/* Account actions */}
        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, overflow: 'hidden', marginBottom: spacing(4), ...cardShadow }}>
          {status === 'signed-in' ? (
            <Pressable onPress={handleSignOut} style={({ pressed }) => ({ padding: spacing(4), flexDirection: 'row', alignItems: 'center', opacity: pressed ? 0.7 : 1 })}>
              <Text style={{ fontSize: typography.size.md, color: colors.danger, fontWeight: '600' }}>Sign out</Text>
            </Pressable>
          ) : (
            <>
              <Pressable onPress={() => router.push('/auth/sign-in')} style={({ pressed }) => ({ padding: spacing(4), flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 })}>
                <Text style={{ fontSize: typography.size.md, color: colors.primary, fontWeight: '600' }}>Sign in</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/auth/sign-up')} style={({ pressed }) => ({ padding: spacing(4), flexDirection: 'row', alignItems: 'center', opacity: pressed ? 0.7 : 1 })}>
                <Text style={{ fontSize: typography.size.md, color: colors.text }}>Create account</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* App info */}
        <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), ...cardShadow }}>
          <Text style={{ fontSize: typography.size.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>About</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: typography.size.md, color: colors.text }}>Version</Text>
            <Text style={{ fontSize: typography.size.md, color: colors.textMuted }}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
