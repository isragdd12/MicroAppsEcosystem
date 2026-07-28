import { useAuth } from '@microapps/auth';
import { Button, Screen, Stack, TextInput } from '@microapps/ui';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text } from 'react-native';
import { useTheme } from '@microapps/theme';

export function SignInScreen() {
  const { signInWithEmail } = useAuth();
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    try {
      setError(null);
      setLoading(true);
      await signInWithEmail(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Stack gap={4} style={{ padding: spacing(6) }}>
        <Text
          style={{
            fontSize: typography.size.xxl,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: spacing(2),
          }}
        >
          Welcome back
        </Text>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />
        {error && (
          <Text style={{ color: colors.danger, fontSize: typography.size.sm }}>
            {error}
          </Text>
        )}
        <Button
          label={loading ? 'Signing in…' : 'Sign in'}
          onPress={handleSignIn}
        />
        <Button
          label="Create account"
          variant="secondary"
          onPress={() => router.push('/auth/sign-up')}
        />
        <Button
          label="Continue without signing in"
          variant="ghost"
          onPress={() => router.replace('/(tabs)')}
        />
      </Stack>
    </Screen>
  );
}
