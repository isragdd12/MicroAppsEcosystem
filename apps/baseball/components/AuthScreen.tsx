import { useAuth } from '@microapps/core';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { cardShadow } from '../lib/styles';

export function AuthScreen() {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email.trim(), password);
        router.replace('/');
      } else {
        await signUpWithEmail(email.trim(), password);
        Alert.alert('Account created!', 'Check your email to confirm, then sign in.');
        setMode('signin');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#FBF5E6' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ fontSize: 56, marginBottom: 8 }}>⚾</Text>
          <Text style={{ fontSize: 28, fontWeight: '900', color: '#2C1810', letterSpacing: -0.5 }}>Baseball Quest</Text>
          <Text style={{ fontSize: 15, color: '#7A6652', marginTop: 4 }}>Arena</Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, ...cardShadow }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#2C1810', marginBottom: 20 }}>
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Text>

          <Text style={{ fontSize: 13, fontWeight: '700', color: '#7A6652', marginBottom: 6 }}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ backgroundColor: '#FBF5E6', borderRadius: 12, padding: 14, fontSize: 15, color: '#2C1810', marginBottom: 16, borderWidth: 1, borderColor: '#DDD0BB' }}
            placeholderTextColor="#B8A080"
          />

          <Text style={{ fontSize: 13, fontWeight: '700', color: '#7A6652', marginBottom: 6 }}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            style={{ backgroundColor: '#FBF5E6', borderRadius: 12, padding: 14, fontSize: 15, color: '#2C1810', marginBottom: 24, borderWidth: 1, borderColor: '#DDD0BB' }}
            placeholderTextColor="#B8A080"
          />

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: '#D4A017',
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: pressed || loading ? 0.7 : 1,
              ...cardShadow,
            })}
          >
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#2C1810' }}>
              {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')} style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: '#7A6652' }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <Text style={{ fontWeight: '700', color: '#1B3A6B' }}>
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
