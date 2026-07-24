# Database — Cross-Cutting Data Model

This document covers the parts of the data layer that apply across both
SQLite and Postgres: the repository pattern, common entity fields, ID
strategy, and schema evolution rules. Storage-specific details live in
[SQLITE.md](SQLITE.md) and [SUPABASE.md](SUPABASE.md); the movement of
data between them lives in [SYNC_ENGINE.md](SYNC_ENGINE.md).

## The repository pattern

**Screens never issue SQL, touch `expo-sqlite` directly, or call a
repository directly.** Every feature enforces this fixed layering (see
[REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md)):

```
UI (screen/component)
  → Feature hook (e.g. useFeedPet(), in apps/petcare/features/feeding/hooks/)
      → Repository (e.g. FeedRepository.add())
          → Drizzle query against local SQLite (via packages/data primitives)
              → on write: also appends a SyncQueue entry
```

A base `Repository<T>` in `packages/data` — a generic, app-agnostic
primitive, per the "packages as internal SDKs" rule — provides generic
`create/update/delete/getById` backed by Drizzle, plus automatic
sync-queue enqueueing on every mutating call. Feature-specific
repositories (`PetRepository`, `FeedRepository`) live inside their
feature (`apps/<app>/features/<feature>/repository/`) and extend the base
class, adding domain query methods (`listByOwner`, `findOverdueFeedings`).
`packages/data` must never know a "Pet" or a "Feed" exists — it only
knows `Repository<T>` for an arbitrary Drizzle table shape.

**The feature hook, not the repository, is where feature business logic
lives.** A repository is dumb persistence (CRUD + simple domain queries).
Orchestration — "feeding a pet also reschedules its next reminder,"
"deleting a pet cascades to its feeding logs" — belongs in the hook
(`useFeedPet`), which may call more than one repository. This keeps
repositories trivially testable and reusable, and keeps orchestration
logic in one discoverable place per feature rather than smeared across
screens.

**Why this boundary matters:** it's the one place we can guarantee (a)
every write is validated against its Zod schema, (b) every write is
queued for sync without screens having to remember to do it, (c) SQLite
can be swapped or the schema can change shape without touching screen
code, and (d) business logic for a feature lives in exactly one layer
(the hook), not duplicated across every screen that happens to need it.

## Every table has these columns

To make sync and conflict resolution mechanical rather than bespoke per
table, every syncable entity — in both SQLite and its Postgres mirror —
has:

| Column        | Type                                                 | Purpose                                                                                                                                                                                            |
| ------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | `text` (UUID v4)                                     | Primary key. Generated client-side (see ID strategy below).                                                                                                                                        |
| `created_at`  | `text` (ISO 8601)                                    | Set once, client-side, at creation.                                                                                                                                                                |
| `updated_at`  | `text` (ISO 8601)                                    | Set client-side on every local write; **overwritten with server-received time on sync push** — see [SYNC_ENGINE.md](SYNC_ENGINE.md). This server-received value is the actual conflict tiebreaker. |
| `deleted_at`  | `text \| null`                                       | Soft delete. Rows are never hard-deleted locally until the tombstone has synced (see below).                                                                                                       |
| `owner_id`    | `text \| null`                                       | Supabase `auth.users.id` once the user is signed in; `null` for fully local/anonymous data. Backfilled on first sign-in.                                                                           |
| `sync_status` | `text` (local-only column, not mirrored to Postgres) | `'synced' \| 'pending' \| 'conflict'` — lets the UI show a subtle sync indicator if desired.                                                                                                       |

Domain-specific columns are, of course, per-table (a `pets` table has
`name`, `species`, `birth_date`, etc.) — those are defined per feature in
`apps/<app>/features/<feature>/db/schema.ts` and mirrored in
`supabase/migrations/`.

## Why UUIDs generated client-side, not auto-increment IDs

An offline-first app must be able to create a fully-formed, referenceable
record (a Pet, then a FeedingLog that references that Pet's id) before
ever talking to the server. Server-assigned auto-increment IDs would mean
either blocking record creation on connectivity, or juggling temporary
local IDs that get rewritten post-sync (a significant source of subtle
bugs — anything that captured the temporary ID before rewrite goes
stale). Client-generated UUIDs sidestep this entirely: the ID is final
the moment the record is created, online or not.

## Soft deletes and tombstones

Hard-deleting a row locally before that deletion has synced would mean
the sync queue has nothing to push, and the record would silently
reappear on the next pull from Supabase. Instead: `delete()` sets
`deleted_at`, the row is filtered out of all normal repository queries
(`WHERE deleted_at IS NULL` baked into base query methods), and the sync
engine pushes the tombstone like any other update. The row is only
hard-deleted locally once the tombstone is confirmed synced. Postgres
rows follow the same soft-delete pattern (a `deleted_at` filter in RLS
policies — see [SUPABASE.md](SUPABASE.md)) so that a delete on one device
correctly propagates as a delete on another, not a resurrection.

## Schema evolution / migrations

- **SQLite**: Drizzle-generated migrations, run on app boot by
  `packages/data`'s migration runner, tracked in a local
  `__migrations` table. Each feature owns its own migration set in
  `apps/<app>/features/<feature>/db/migrations/`.
- **Postgres**: plain SQL migrations in `supabase/migrations/`, applied
  via the Supabase CLI (`supabase db push` in CI/deploy, never applied
  by hand against production). See [SUPABASE.md](SUPABASE.md).
- **Rule:** a schema change that affects a synced entity must land in
  _both_ migration sets in the same PR, keeping the SQLite shape and its
  Postgres mirror from silently drifting. This is checked manually for
  v1 (see [ROADMAP.md](ROADMAP.md) for a possible future lint/CI check).
- Additive changes (new nullable column) are preferred over destructive
  ones. Renaming/removing a synced column requires a deployed app version
  that can no longer produce the old shape before the column is dropped
  server-side — plan the rollout order, don't drop and ship
  simultaneously.

## Validation boundary

Every repository write is validated against the entity's Zod schema
_before_ it touches SQLite — invalid data should never enter the local
database, since it will otherwise propagate through sync into Postgres.
See [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md) for how the same schema is
reused on the form layer.
