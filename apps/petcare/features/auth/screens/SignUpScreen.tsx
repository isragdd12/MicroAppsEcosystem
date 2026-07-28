import { useAuth } from '@microapps/auth';
import { Button, Screen, Stack, TextInput } from '@microapps/ui';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text } from 'react-native';
import { useTheme } from '@microapps/theme';

export function SignUpScreen() {
  const { signUpWithEmail } = useAuth();
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    try {
      setError(null);
      setLoading(true);
      await signUpWithEmail(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign up failed');
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
          Create account
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
          placeholder="Min 6 characters"
          secureTextEntry
        />
        {error && (
          <Text style={{ color: colors.danger, fontSize: typography.size.sm }}>
            {error}
          </Text>
        )}
        <Button
          label={loading ? 'Creating account…' : 'Create account'}
          onPress={handleSignUp}
        />
        <Button
          label="Already have an account? Sign in"
          variant="ghost"
          onPress={() => router.back()}
        />
      </Stack>
    </Screen>
  );
}
