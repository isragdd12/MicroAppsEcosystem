import type { Session, SupabaseClient } from '@supabase/supabase-js';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { AuthSession, AuthState, AuthUser } from './types';

function toAuthSession(session: Session | null): AuthSession | null {
  if (!session) return null;
  const user: AuthUser = {
    id: session.user.id,
    email: session.user.email ?? null,
  };
  return {
    user,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? null,
  };
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

/**
 * Provides auth session state app-wide — see docs/ARCHITECTURE.md's
 * "auth is optional" decision: `status` starts at `'loading'` while the
 * client checks for an existing session, then settles to `'signed-out'`
 * (the default, fully-functional state) or `'signed-in'`. Nothing in
 * this provider blocks app usage while signed out; it only exposes
 * state for the small number of routes/features that need it (see
 * docs/NAVIGATION.md's auth-gated routing).
 */
export function AuthProvider({ client, children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    session: null,
  });

  useEffect(() => {
    let cancelled = false;

    client.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const session = toAuthSession(data.session);
      setState({ status: session ? 'signed-in' : 'signed-out', session });
    });

    const { data: subscription } = client.auth.onAuthStateChange(
      (_event, session) => {
        const authSession = toAuthSession(session);
        setState({
          status: authSession ? 'signed-in' : 'signed-out',
          session: authSession,
        });
      },
    );

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signUpWithEmail: async (email, password) => {
        const { error } = await client.auth.signUp({ email, password });
        if (error) throw error;
      },
      signInWithEmail: async (email, password) => {
        const { error } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      },
      signOut: async () => {
        const { error } = await client.auth.signOut();
        if (error) throw error;
      },
    }),
    [state, client],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * The only way app/feature code should read auth state or trigger
 * sign-in/out — never call the Supabase client's auth methods directly
 * outside this package, so session handling stays in one place.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
