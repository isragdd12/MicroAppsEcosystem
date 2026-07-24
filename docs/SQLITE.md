# SQLite — On-Device Data Layer

SQLite (via `expo-sqlite`, wrapped by Drizzle ORM) is the **source of
truth** on-device. Every read a screen performs is a local SQLite read;
Supabase is never queried directly by the UI. See
[DATABASE.md](DATABASE.md) for the cross-cutting schema conventions
(common columns, soft deletes, IDs) that apply here and to Postgres alike.

## Why SQLite specifically

- Ships with `expo-sqlite`, no extra native module to maintain.
- Real relational queries (joins, indexes, `WHERE` filters) — needed the
  moment an app has more than one related entity (Pet → FeedingLog →
  VetVisit), which rules out simpler key-value options like
  `AsyncStorage` or `expo-secure-store` for primary data.
- Synchronous-feeling API (via Drizzle) keeps repository code simple
  compared to hand-managing a lower-level async native bridge.
- Battle-tested for offline-first mobile apps generally.

## One database file per app

Each app (`petcare`, `gardening`, ...) opens its own SQLite database
file (e.g. `petcare.db`). Apps do not share a database file or tables —
this mirrors "apps are independent products" from
[ARCHITECTURE.md](ARCHITECTURE.md) and means one app's schema migrations
can never affect another's runtime.

## Schema definition

Schema lives per-feature, in `apps/<app>/features/<feature>/db/schema.ts`,
as Drizzle table definitions — this is the single source of truth for
that feature's local shape, and Drizzle's type inference means repository
code gets full TypeScript checking against it. A feature's schema file is
the only place that feature's table shape is defined; the app-wide
migration runner (from `packages/data`) discovers and combines schemas
from every feature at boot. Example shape (illustrative, not final):

```ts
// apps/petcare/features/pets/db/schema.ts
export const pets = sqliteTable('pets', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id'),
  name: text('name').notNull(),
  species: text('species').notNull(),
  birthDate: text('birth_date'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
  syncStatus: text('sync_status').notNull().default('pending'),
});
```

## Indexes

Every table gets an index on `deleted_at` (nearly every query filters it
out) and on any foreign key used in a join (e.g. `feeding_logs.pet_id`).
Additional indexes are added deliberately when a specific query pattern
is shown to need one — not speculatively.

## Migrations

Drizzle Kit generates migration SQL from schema diffs
(`drizzle-kit generate`). Migrations are committed to
`apps/<app>/features/<feature>/db/migrations/` and applied automatically
on app boot by a shared migration runner in `packages/data`, which tracks
applied
migrations in a local `__migrations` table and applies any that are
missing, in order, inside a transaction. A failed migration blocks app
boot with a clear error surfaced through the error-handling layer (see
[ERROR_HANDLING.md](ERROR_HANDLING.md)) rather than silently continuing
against a half-migrated schema.

## Transactions

Any repository operation that touches more than one table (e.g. deleting
a Pet and cascading soft-deletes to its FeedingLogs) runs inside a single
SQLite transaction, so a crash mid-operation can't leave the local
database in a half-written state.

## The `sync_status` column and the outbox pattern

Every syncable table has a local-only `sync_status` column
(`'synced' | 'pending' | 'conflict'`). Rather than scanning every table
for pending rows, the base `Repository.create/update/delete` methods
_also_ insert a row into a dedicated `sync_queue` table (the "outbox")
in the same transaction as the domain write. The sync engine only ever
reads from `sync_queue`, never scans domain tables directly. Full design
in [SYNC_ENGINE.md](SYNC_ENGINE.md).

## What does NOT go in SQLite

- **Media files themselves** — photos are written to the filesystem
  (`expo-file-system`) with SQLite storing only the local file path/URI
  plus sync metadata (mirroring the structured-data outbox pattern for
  the upload). Keeps the DB file small and fast to query/back up.
- **Session tokens / secrets** — those live in `expo-secure-store`, never
  in the app database. See [SECURITY.md](SECURITY.md).
- **Ephemeral UI state** (selected tab, in-progress unsaved form) — that
  belongs in Zustand, not persisted storage. See
  [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md).

## Anonymous → authenticated transition

Rows created before sign-in have `owner_id = null`. On first successful
sign-in, a one-time local operation stamps `owner_id` on every existing
row with a null owner (and marks them `sync_status = 'pending'`), which
causes the sync engine to push the user's entire pre-existing local
history up to Supabase, attached to their new account. No local data is
ever discarded by signing in.

## Web caveat

`expo-sqlite` on Web currently runs on top of WASM SQLite backed by
IndexedDB persistence. Functionally equivalent from the repository
layer's point of view (same Drizzle interface), but it's worth flagging
in testing — see [TESTING.md](TESTING.md) — since the Web target can have
subtly different storage-quota and persistence-guarantee behavior than
native SQLite. Re-verify this against the current Expo SDK when Web
support work begins, as this layer moves quickly.
