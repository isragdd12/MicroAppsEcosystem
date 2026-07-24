import path from 'node:path';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(__dirname, '..', '.env') });

// Milestone 1 exit criteria (docs/ROADMAP.md): sign up/sign in works, and
// RLS actually enforces cross-user isolation on public.users /
// public.subscriptions (docs/SUPABASE.md, docs/SECURITY.md — "RLS is the
// real boundary").
//
// NOTE: runs against the REAL remote MicroAppsDB project, not a local
// Docker stack — the project has deliberately deferred local Supabase
// dev tooling (Docker) for now. This creates real (harmless, randomly
// emailed, password-only) throwaway auth users in the real project on
// every run. docs/SUPABASE.md's local-stack-first guidance should be
// revisited once Docker is set up; until then this is a known tradeoff,
// not an oversight.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'SUPABASE_URL and SUPABASE_ANON_KEY must be set (see supabase/tests/.env.example).',
  );
}

function freshEmail(label: string): string {
  // Supabase's remote signup validation rejects some non-deliverable TLDs
  // (e.g. .test) even with email confirmation disabled — gmail.com with
  // a unique local part passes validation without needing a real inbox,
  // since confirmation is off.
  return `microapps-smoketest-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@gmail.com`;
}

async function signUpAndSignIn(
  client: SupabaseClient,
  email: string,
  password: string,
) {
  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email,
    password,
  });
  if (signUpError) throw signUpError;

  // Local stack has email confirmation disabled by default (config.toml:
  // auth.email.enable_confirmations = false), so the session is usable
  // immediately without a confirmation step.
  const { data: signInData, error: signInError } =
    await client.auth.signInWithPassword({
      email,
      password,
    });
  if (signInError) throw signInError;

  return { userId: signUpData.user?.id ?? signInData.user?.id };
}

describe('public schema RLS isolation (Milestone 1)', () => {
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let userAId: string | undefined;
  let userBId: string | undefined;

  beforeAll(async () => {
    clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const a = await signUpAndSignIn(
      clientA,
      freshEmail('user-a'),
      'correct horse battery staple',
    );
    const b = await signUpAndSignIn(
      clientB,
      freshEmail('user-b'),
      'correct horse battery staple',
    );
    userAId = a.userId;
    userBId = b.userId;
  });

  it('sign-up automatically creates a public.users row (via handle_new_user trigger)', async () => {
    const { data, error } = await clientA
      .from('users')
      .select('id')
      .eq('id', userAId)
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBe(userAId);
  });

  it('a user can read their own public.users row', async () => {
    const { data, error } = await clientB
      .from('users')
      .select('id')
      .eq('id', userBId)
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBe(userBId);
  });

  it("a user CANNOT read another user's public.users row (RLS isolation)", async () => {
    const { data, error } = await clientA
      .from('users')
      .select('id')
      .eq('id', userBId);

    // RLS makes the row invisible rather than erroring — an empty result
    // set is the expected (and correct) outcome here, not a thrown error.
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("a user CANNOT read another user's public.subscriptions rows", async () => {
    const { data, error } = await clientA
      .from('subscriptions')
      .select('id')
      .eq('user_id', userBId);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('a user cannot directly insert a subscription row for themselves (service-role only)', async () => {
    const { error } = await clientA.from('subscriptions').insert({
      user_id: userAId,
      app_id: 'petcare',
      product_id: 'petcare_premium_monthly',
      status: 'active',
    });

    // No insert policy exists for authenticated users (docs/SUPABASE.md:
    // subscriptions are written only by the RevenueCat webhook using the
    // service role) — this must be rejected by RLS, not silently allowed.
    expect(error).not.toBeNull();
  });
});
