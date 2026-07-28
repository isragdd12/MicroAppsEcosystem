export interface AuthUser {
  id: string;
  email: string | null;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
}

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in';

export interface AuthState {
  status: AuthStatus;
  session: AuthSession | null;
}

/**
 * A storage adapter the Supabase client persists its session through —
 * see docs/SECURITY.md: session tokens live in `expo-secure-store`, never
 * in SQLite/AsyncStorage. This package takes the adapter as a
 * dependency rather than importing expo-secure-store directly, so it has
 * no Expo/React-Native dependency of its own and stays usable from
 * non-Expo contexts too (e.g. scripts, tests).
 */
export interface AuthStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
