-- Milestone 1: public schema — cross-app users mirror + per-app subscriptions.
-- See docs/SUPABASE.md ("Schema organization", "Billing / entitlements").

-- public.users mirrors auth.users 1:1 for app-level profile fields that
-- don't belong in Supabase's managed auth table (display name, avatar).
-- Row is created automatically when a new auth user signs up, via trigger.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a public.users row whenever a new auth.users row is created,
-- so the app never has to remember to do this itself after sign-up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- public.subscriptions — per-app entitlement records, kept in sync with
-- RevenueCat via a webhook-driven Edge Function (see docs/SUPABASE.md,
-- "Billing / entitlements"; Edge Function itself lands in a later
-- milestone). One row per (user, app) the user has ever purchased.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  app_id text not null,
  product_id text not null,
  status text not null check (status in ('active', 'expired', 'cancelled', 'in_grace_period')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, app_id, product_id)
);

create index subscriptions_user_id_app_id_idx
  on public.subscriptions (user_id, app_id);

alter table public.subscriptions enable row level security;

create policy "users can read own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Subscriptions are written only by the RevenueCat webhook Edge Function
-- (using the service role, which bypasses RLS per docs/SECURITY.md) —
-- no direct client-side insert/update policy is defined, intentionally.
