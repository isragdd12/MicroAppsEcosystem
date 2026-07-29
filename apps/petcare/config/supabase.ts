import { createAuthClient } from '@microapps/auth';
import { Platform } from 'react-native';

import { getSupabaseConfig } from './env';

// SSR-safe storage: localStorage only exists in the browser, not in Node.js SSR
const isBrowser = Platform.OS === 'web' && typeof window !== 'undefined';

const storage = isBrowser
  ? {
      getItem: (key: string) =>
        Promise.resolve(window.localStorage.getItem(key)),
      setItem: (key: string, value: string) => {
        window.localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        window.localStorage.removeItem(key);
        return Promise.resolve();
      },
    }
  : Platform.OS !== 'web'
    ? {
        getItem: async (key: string) => {
          const { getItemAsync } = await import('expo-secure-store');
          return getItemAsync(key);
        },
        setItem: async (key: string, value: string) => {
          const { setItemAsync } = await import('expo-secure-store');
          await setItemAsync(key, value);
        },
        removeItem: async (key: string) => {
          const { deleteItemAsync } = await import('expo-secure-store');
          await deleteItemAsync(key);
        },
      }
    : // SSR (Node.js) — no-op; Supabase won't find a session, which is correct for SSR
      {
        getItem: (_key: string) => Promise.resolve(null),
        setItem: (_key: string, _value: string) => Promise.resolve(),
        removeItem: (_key: string) => Promise.resolve(),
      };

const { url, anonKey } = getSupabaseConfig();

export const supabase = createAuthClient({
  supabaseUrl: url,
  supabaseAnonKey: anonKey,
  storage,
});
