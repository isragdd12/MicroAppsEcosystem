import { createAuthClient } from '@microapps/auth';
import * as SecureStore from 'expo-secure-store';

import { getSupabaseConfig } from './env';

const secureStoreAdapter = {
  async getItem(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string) {
    await SecureStore.deleteItemAsync(key);
  },
};

const { url, anonKey } = getSupabaseConfig();

export const supabase = createAuthClient({
  supabaseUrl: url,
  supabaseAnonKey: anonKey,
  storage: secureStoreAdapter,
});
