import { createAuthClient } from '@microapps/auth';
import { Platform } from 'react-native';

import { getSupabaseConfig } from './env';

// expo-secure-store has no web implementation — use localStorage on web
const storage =
  Platform.OS === 'web'
    ? {
        getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
        setItem: (key: string, value: string) => {
          localStorage.setItem(key, value);
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          localStorage.removeItem(key);
          return Promise.resolve();
        },
      }
    : {
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
      };

const { url, anonKey } = getSupabaseConfig();

export const supabase = createAuthClient({
  supabaseUrl: url,
  supabaseAnonKey: anonKey,
  storage,
});
