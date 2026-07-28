import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { AuthStorageAdapter } from './types';

export interface CreateAuthClientOptions {
  supabaseUrl: string;
  supabaseAnonKey: string;
  storage: AuthStorageAdapter;
}

/**
 * Creates the underlying Supabase client used for auth (and, later,
 * PostgREST calls from the sync engine — see docs/SYNC_ENGINE.md). Every
 * app creates its own instance since each Postgres schema is app-scoped
 * (see docs/SUPABASE.md), but the construction logic itself is generic
 * platform infrastructure.
 */
export function createAuthClient(
  options: CreateAuthClientOptions,
): SupabaseClient {
  return createClient(options.supabaseUrl, options.supabaseAnonKey, {
    auth: {
      storage: options.storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}
