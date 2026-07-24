# Sync Engine

The sync engine moves data between local SQLite and Supabase, in both
directions, without the UI ever being aware of network state. It lives in
`packages/sync` as a generic, app-agnostic package (per the internal-SDK
rule in [REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md)) — it knows
about "a table with an outbox," never about "pets."

## Responsibilities

1. **Push**: take locally-queued mutations (the outbox) and send them to
   Supabase, in order, when connectivity + a session are available.
2. **Pull**: fetch remote changes (made on another device, or by a server
   process) and apply them to local SQLite.
3. **Conflict resolution**: when a push and a pull disagree about a row's
   current state, resolve deterministically (last-write-wins).
4. **Media sync**: same push/pull shape, applied to files instead of
   rows.
5. Stay invisible: never block UI interaction, never surface network
   errors as if they were data errors (see [ERROR_HANDLING.md](ERROR_HANDLING.md)).

## The outbox (push path)

Every mutating repository call (`create`/`update`/`delete`) writes to a
local `sync_queue` table in the same SQLite transaction as the domain
write:

```
sync_queue
├── id
├── table_schema      -- e.g. "petcare"
├── table_name         -- e.g. "pets"
├── row_id              -- the entity's id
├── operation           -- 'insert' | 'update' | 'delete'
├── payload             -- JSON snapshot of the row at write time
├── created_at          -- local write time, defines push order
└── attempts             -- retry count, for backoff
```

A background sync loop (triggered on: app foreground, network
reconnect, a timer while foregrounded, and manual pull-to-refresh) reads
`sync_queue` in `created_at` order and pushes each entry to Supabase via
a thin RPC/REST call. On success, the queue entry is deleted and the
row's local `updated_at`/`sync_status` are updated from the server's
response (see conflict resolution below). On failure (offline, server
error), the entry stays queued and is retried with backoff — the user's
local data is never lost or blocked on this succeeding.

**Why an explicit outbox table instead of scanning domain tables for a
"dirty" flag:** a dedicated queue gives a strict, durable push order
(important since a `FeedingLog` insert that references a `Pet` must push
after that `Pet`'s insert) and survives app kills mid-sync without needing
to reconstruct what was in flight. It's also what makes `packages/sync`
generic — it only ever deals with the queue's shape, never a domain
table's shape.

## Pull path

On each sync cycle, after draining the outbox, the engine pulls rows from
Supabase updated since the last successful pull
(`updated_at > last_pull_cursor`, cursor stored locally per table). For
each pulled row:

- If the local row doesn't exist, insert it.
- If it exists and has no pending outbox entry, overwrite it (remote is
  authoritative when there's no local conflict).
- If it exists **and** has a pending outbox entry (a local edit hasn't
  pushed yet) — this is a conflict, resolved as below.

Realtime (Supabase Realtime subscriptions) is **not** used for v1 pull —
periodic/triggered polling is simpler to reason about and sufficient
given this is personal, low-frequency data, not a collaborative
multi-user feed. This is a deliberate v1 simplification; see
[ROADMAP.md](ROADMAP.md) for when Realtime might be worth adding (e.g. if
a future app has genuine multi-user real-time collaboration, like a
shared D&D campaign).

## Conflict resolution: last-write-wins by server timestamp

When a conflict is detected (a local pending edit collides with a
different remote version of the same row), the row with the later
**server-received** `updated_at` wins. Server-received time, not device
clock time, is used specifically because device clocks can't be trusted
to agree — a phone with a wrong clock must not be able to make a stale
edit "win" by claiming a future timestamp.

Mechanically: every push request to Supabase is stamped with
`updated_at = now()` **by Postgres**, not by the client's payload. The
push response returns that authoritative timestamp, which the client
then reconciles against on the next pull. If the client discovers, on
push, that the row was already updated remotely with a later timestamp
than the version it based its edit on, the client's edit is discarded and
the remote version is pulled down instead. The local `sync_status` for
that row flips to `'conflict'` briefly (available for the UI to show a
subtle "this was updated elsewhere" indicator) before settling to
`'synced'`.

**This is a deliberate v1 simplification**, not an oversight: field-level
merge (only overwriting the specific fields that actually changed on each
side) would handle the "edited different fields on two devices" case more
gracefully, but adds real complexity — per-field version vectors or
CRDTs — for a personal-data use case where true concurrent edits are
rare and the cost of an occasional overwritten edit is low. If a specific
future app's usage pattern demonstrates this matters (e.g. genuinely
collaborative editing), field-level merge should be added as an opt-in
strategy per table, not a wholesale replacement of this default.

## Deletes and tombstones

A local delete pushes as an `operation: 'delete'` outbox entry, which the
server applies as `deleted_at = now()` (soft delete, per
[DATABASE.md](DATABASE.md)), not a hard `DELETE`. Pulled tombstones apply
the same way locally. Hard deletion (actually removing the row) only
happens locally after the tombstone is confirmed synced, and is never
performed remotely for v1 (Postgres rows are cheap; a periodic cleanup
job can hard-delete old tombstones later if storage ever becomes a
concern — not needed at current scale).

## Anonymous → authenticated

Before sign-in, the sync loop is a no-op (no session, nothing pushes).
On sign-in, the one-time local re-owning step described in
[SQLITE.md](SQLITE.md) marks all existing local rows `pending`, and a
full push cycle uploads the user's entire local history. This is treated
as an ordinary (if large) push, not a special code path — the outbox
doesn't distinguish "the reason this row is pending."

## Media sync

Photos follow the same outbox shape, with the payload being a local file
URI instead of a JSON row. The push path uploads the file to Supabase
Storage (see [SUPABASE.md](SUPABASE.md)) and, on success, updates the
owning row's remote-URL field via the normal row-sync path. Pulled media
references are downloaded lazily (on first display), not eagerly, to
avoid pulling every photo a user has ever taken the moment a new device
signs in.

## What the UI sees

Screens never check "am I online." They read local SQLite via
TanStack Query (see [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)), and the
sync engine calls `queryClient.invalidateQueries(...)` for affected
tables whenever it applies a pulled change — the screen just re-renders
with fresh local data, indistinguishable from a purely local edit. A
small, optional global sync-status indicator (idle/syncing/error) is the
only sync-awareness surfaced to the user, and even that is app-styled
chrome, not something individual screens implement themselves.

## Failure handling

Push/pull failures (network errors, server 5xx) are logged through
`packages/logger` (see [ERROR_HANDLING.md](ERROR_HANDLING.md)) and
retried with exponential backoff — they are never surfaced to the user as
blocking errors, since by design the user's ability to keep using the app
locally doesn't depend on sync succeeding. Persistent failures (e.g. a
payload that the server rejects as invalid, which retries can't fix) are
capped in retry count and flagged in the sync-status indicator rather
than retried forever.
