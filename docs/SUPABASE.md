# Supabase — Backend

One Supabase project hosts **all** micro-apps. This document covers
Postgres schema organization, RLS, Auth, Storage, and Edge Functions.
Cross-cutting entity conventions are in [DATABASE.md](DATABASE.md); how
data actually moves between SQLite and here is in
[SYNC_ENGINE.md](SYNC_ENGINE.md).

## Why one Supabase project, not one per app

Per-app projects would mean per-app auth (a user who uses two apps would
need two accounts, breaking the natural expectation of "one account,
multiple apps") and per-app billing plumbing duplicated N times. A single
project with schema-per-app isolation gets us one account system and one
place to manage infra, while RLS still gives us the same data isolation
guarantees per app.

## Schema organization: one Postgres schema per app

```
public/                  -- shared: users, subscriptions/entitlements, sync metadata
petcare/                 -- petcare app's tables: pets, feeds, medications, walks...
gardening/                -- gardening app's tables (added later)
dnd_campaign/             -- ...
```

Each app's tables live in their own Postgres schema, named after the app.
This keeps table names simple within an app (`petcare.pets` not
`pets_petcare_app`) and makes it visually obvious, in any SQL tooling,
which app a table belongs to — mirroring the `apps/<app>/features/`
isolation on the client. The `public` schema is reserved for genuinely
cross-app concerns: `public.users` (mirrors `auth.users` 1:1 for
app-level profile fields), `public.subscriptions` (per-app entitlement
records, see Billing below), and a small amount of sync bookkeeping.

**Rule:** an app's Edge Functions and RLS policies may reference
`public.*`, but no table in one app's schema ever references a table in
another app's schema. Apps stay data-isolated from each other even though
they share infrastructure.

## Table shape

Every table mirrors its SQLite counterpart's common columns (see
[DATABASE.md](DATABASE.md)): `id` (uuid, client-generated, matches the
SQLite row's id — this is the join key across the sync boundary),
`created_at`, `updated_at` (server-authoritative — see
[SYNC_ENGINE.md](SYNC_ENGINE.md)), `deleted_at` (soft delete), `owner_id`
(references `auth.users.id`, `not null` here — unlike SQLite, a row never
reaches Postgres unless it belongs to a signed-in user).

## Row Level Security

RLS is enabled on every table, no exceptions. The standard policy shape
per table:

```sql
create policy "owner can read own rows"
  on petcare.pets for select
  using (auth.uid() = owner_id);

create policy "owner can write own rows"
  on petcare.pets for insert, update, delete
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
```

Soft-deleted rows are still selectable by their owner (the client filters
`deleted_at` locally, same as SQLite) so tombstones can sync down to other
devices. RLS is the actual security boundary here — see
[SECURITY.md](SECURITY.md) for why this matters even though the UI never
queries Postgres directly (Edge Functions and any future admin/reporting
tooling do, and RLS means a bug in that code can't leak cross-user data).

## Auth

Supabase Auth (email/password + at least one OAuth provider, e.g. Google,
for lower-friction signup — finalize provider list during Pet Care
implementation). Session tokens are stored via `expo-secure-store` on the
client, never in SQLite or AsyncStorage — see [SECURITY.md](SECURITY.md).

Sign-in is **optional**: an app is fully functional against local SQLite
alone. Auth only gates: (1) sync, (2) subscription/entitlement checks,
(3) server-side push reminders. See [SQLITE.md](SQLITE.md) for the
anonymous → authenticated data attachment flow.

## Storage

Supabase Storage, one bucket per app (`petcare-media`, `gardening-media`,
...), with storage policies mirroring the RLS pattern (a user can only
read/write objects under their own `owner_id`-prefixed path,
e.g. `petcare-media/<owner_id>/<pet_id>/<photo_id>.jpg`). Media sync
follows the same offline-first, background-upload pattern as structured
data — see [SYNC_ENGINE.md](SYNC_ENGINE.md).

## Edge Functions

Deno-based, deployed from `supabase/functions/`. Used for exactly two
categories of server-side logic, deliberately kept small:

- **AI proxy** (`ai-proxy`): receives a summarized-context request from
  the client, calls the configured LLM provider using a server-held API
  key, returns the response. The client never holds an LLM API key. See
  [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md).
- **Push dispatch** (`push-dispatch`): scheduled (via `pg_cron` or
  Supabase's scheduled triggers) function that finds due reminders for
  signed-in users and sends via Expo Push. See
  [ARCHITECTURE.md](ARCHITECTURE.md).

Edge Functions are the only server-side code in this architecture beyond
the database itself — there is no separate long-running backend service
to operate.

## Billing / entitlements

`public.subscriptions` records `(user_id, app_id, product_id, status,
expires_at)`, kept in sync with RevenueCat via its webhook → an Edge
Function (`revenuecat-webhook`) that upserts entitlement rows. Each app
checks its own entitlement row (`app_id = 'petcare'`) — this is what
makes subscriptions per-app rather than account-wide, per
[ARCHITECTURE.md](ARCHITECTURE.md)'s monetization decision. Entitlement
checks happen client-side against the locally-synced subscription status
for offline access to already-purchased features, with RevenueCat as the
source of truth reconciled on each app foreground.

## Migrations

Plain SQL files in `supabase/migrations/`, applied via
`supabase db push` (or `supabase migration up` locally) — never edited by
hand against the live database. CI runs migrations against a fresh
Supabase local instance (via the Supabase CLI's local dev stack) as part
of the test suite to catch broken migrations before merge. See
[CODING_STANDARDS.md](CODING_STANDARDS.md) and [TESTING.md](TESTING.md).

## Local development

The Supabase CLI's local stack (Postgres + Auth + Storage + Edge
Functions emulation, all in Docker) is the default dev environment —
developing against a shared remote "dev" project is avoided so schema
experiments don't collide with anything else. `supabase start` /
`supabase db reset` are the primary local workflow commands.
