import { useAuth } from '@microapps/auth';
import { useTheme } from '@microapps/theme';
import { Button, Card, Screen, Stack } from '@microapps/ui';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

export function SettingsScreen() {
  const { status, session, signOut } = useAuth();
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace('/auth/sign-in');
  }

  return (
    <Screen>
      <Stack gap={4} style={{ padding: spacing(4) }}>
        <Text
          style={{
            fontSize: typography.size.xl,
            fontWeight: 'bold',
            color: colors.text,
          }}
        >
          Settings
        </Text>

        <Card>
          <Text
            style={{
              fontSize: typography.size.md,
              color: colors.text,
              marginBottom: spacing(1),
            }}
          >
            Account
          </Text>
          {status === 'signed-in' && session ? (
            <>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: colors.textMuted,
                }}
              >
                Signed in as {session.user.email}
              </Text>
              <Button
                label="Sign out"
                variant="secondary"
                onPress={handleSignOut}
                style={{ marginTop: spacing(3) }}
              />
            </>
          ) : (
            <>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: colors.textMuted,
                }}
              >
                Not signed in — your data is stored locally only.
              </Text>
              <Button
                label="Sign in"
                onPress={() => router.push('/auth/sign-in')}
                style={{ marginTop: spacing(3) }}
              />
            </>
          )}
        </Card>

        <Card>
          <Text style={{ fontSize: typography.size.md, color: colors.text }}>
            App
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.textMuted,
              marginTop: spacing(1),
            }}
          >
            Version 1.0.0
          </Text>
        </Card>
      </Stack>
    </Screen>
  );
}
