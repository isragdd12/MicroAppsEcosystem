import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export interface AuthUser {
  id: string;
  email: string | null;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string | undefined;
  expiresAt: number | null;
}

export interface AuthState {
  status: 'loading' | 'signed-in' | 'signed-out';
  session: AuthSession | null;
}

export interface AuthStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface CreateAuthClientOptions {
  supabaseUrl: string;
  supabaseAnonKey: string;
  storage: AuthStorageAdapter;
}

export function createAuthClient(options: CreateAuthClientOptions): SupabaseClient {
  return createClient(options.supabaseUrl, options.supabaseAnonKey, {
    auth: {
      storage: options.storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export interface AuthContextValue extends AuthState {
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  client: SupabaseClient;
  children: React.ReactNode;
}

export function AuthProvider({ client, children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({ status: 'loading', session: null });

  useEffect(() => {
    let cancelled = false;
    client.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const s = data.session;
      const session = s
        ? { user: { id: s.user.id, email: s.user.email ?? null }, accessToken: s.access_token, refreshToken: s.refresh_token, expiresAt: s.expires_at ?? null }
        : null;
      setState({ status: session ? 'signed-in' : 'signed-out', session });
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, s) => {
      const session = s
        ? { user: { id: s.user.id, email: s.user.email ?? null }, accessToken: s.access_token, refreshToken: s.refresh_token, expiresAt: s.expires_at ?? null }
        : null;
      setState({ status: session ? 'signed-in' : 'signed-out', session });
    });

    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [client]);

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    signUpWithEmail: async (email, password) => {
      const { error } = await client.auth.signUp({ email, password });
      if (error) throw error;
    },
    signInWithEmail: async (email, password) => {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signOut: async () => {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },
  }), [state, client]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
