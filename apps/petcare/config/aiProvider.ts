import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env';

export let cachedAccessToken: string | null = null;

export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
}

export const aiConfig = {
  supabaseUrl: SUPABASE_URL,
  supabaseAnonKey: SUPABASE_ANON_KEY,
  getAccessToken: () => cachedAccessToken,
};
