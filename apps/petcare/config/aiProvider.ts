import { EdgeFunctionAiProvider } from '@microapps/ai';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env';

export const aiProvider = new EdgeFunctionAiProvider({
  supabaseUrl: SUPABASE_URL,
  supabaseAnonKey: SUPABASE_ANON_KEY,
  getAccessToken: () => {
    // expo-sqlite is sync but supabase session is async — we cache it in a module var
    // updated by the AuthProvider's onAuthStateChange listener (see _layout.tsx)
    return cachedAccessToken;
  },
});

export let cachedAccessToken: string | null = null;

export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
}
