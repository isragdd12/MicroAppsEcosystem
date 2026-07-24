# Error Handling

## Philosophy

Errors are categorized by where they happen and whether the user's core
workflow (local, offline-capable usage) is affected. Most errors in this
architecture — sync failures, AI failures — must **not** block or
degrade core functionality, per [ARCHITECTURE.md](ARCHITECTURE.md)'s
offline-first and AI-is-secondary principles. A small number — local
validation failures, local DB corruption — genuinely need to stop the
user and be addressed.

## Error categories

| Category                        | Example                                           | User-facing treatment                                                                                                     |
| ------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Validation error**            | Zod rejects form input                            | Inline field error, blocks submit                                                                                         |
| **Local data error**            | SQLite write fails, migration fails               | Blocking error screen — this is the one category that can't be silently degraded, since local data is the source of truth |
| **Sync error**                  | Push/pull fails, offline, server 5xx              | Silent retry + subtle non-blocking sync-status indicator only                                                             |
| **AI error**                    | Edge Function timeout, provider error, rate limit | Empty/retry state scoped to just the AI feature; rest of screen unaffected                                                |
| **Auth error**                  | Invalid credentials, expired session              | Inline error on the Auth screen; does not affect already-loaded local data elsewhere in the app                           |
| **Unexpected/programmer error** | Unhandled exception, invariant violation          | React error boundary, generic fallback UI, logged with full context                                                       |

## `packages/logger`: a provider-agnostic logging interface

Per the decision to design for observability tooling now and wire in an
actual provider (e.g. Sentry) later, every part of the codebase logs
through one interface, never through raw `console.log`/direct Sentry SDK
calls:

```ts
// packages/logger/src/types.ts — the public contract
interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(error: unknown, context?: Record<string, unknown>): void;
  setUser(user: { id: string } | null): void;
}
```

The default implementation writes to `console.*` (with sensible
formatting) and is a complete, working logger on its own. Swapping in
Sentry later means writing one new `Logger` implementation (wrapping
`Sentry.captureException` etc.) and changing one line where the logger is
constructed at app startup — no call site anywhere in the app changes.
This is the same "interface first, concrete provider later, swap via
config not code" shape used for AI providers (see
[AI_ARCHITECTURE.md](AI_ARCHITECTURE.md)).

## Typed application errors

Domain code throws typed errors, not raw strings, so calling code
(feature hooks, UI) can handle categories rather than parsing messages:

```ts
// packages/data/src/errors.ts
class RepositoryError extends Error {
  constructor(
    message: string,
    public cause?: unknown,
  ) {
    super(message);
  }
}
class ValidationError extends RepositoryError {}
class NotFoundError extends RepositoryError {}

// packages/sync/src/errors.ts
class SyncError extends Error {
  constructor(
    message: string,
    public retryable: boolean,
    public cause?: unknown,
  ) {
    super(message);
  }
}

// packages/ai/src/errors.ts
class AiRequestError extends Error {
  constructor(
    message: string,
    public code: 'rate_limited' | 'provider_error' | 'timeout',
    public cause?: unknown,
  ) {
    super(message);
  }
}
```

Each shared package defines its own narrow error types as part of its
public API (consistent with "packages as internal SDKs" —
[REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md)); feature hooks catch
and handle these typed errors rather than a generic `catch (e)` that has
to guess what went wrong.

## React error boundaries

Each app has a root-level error boundary (catches genuinely unexpected
render/runtime errors, shows a generic "something went wrong" screen with
a reload action, logs via `packages/logger`) plus a lighter boundary
around any AI-feature widget specifically (so an AI panel crashing can't
take down the screen it's embedded in — reinforcing "AI is secondary").
Boundaries are a backstop for programmer errors, not the primary
mechanism for expected failure modes (network, validation) — those are
handled explicitly via typed errors and loading/error states from
TanStack Query, not by letting them throw into a boundary.

## Sync errors specifically

Per [SYNC_ENGINE.md](SYNC_ENGINE.md): retried with backoff, logged at
`warn` (not `error`, since transient network failure is expected/normal
in an offline-first app) unless retries are exhausted, in which case
logged at `error` with the queued operation's context (table, operation
type — never the full payload, to avoid logging potentially sensitive
user data). Never shown as a blocking dialog.

## AI errors specifically

Logged at `warn` for expected failure modes (rate limit, timeout) and
`error` for unexpected provider responses. The feature hook surfaces a
simple retryable state (`{ status: 'error', retry: () => void }`) to the
screen; screens render a small inline "couldn't generate insights right
now" affordance in place of just the AI panel, never a full-screen error.

## What gets logged, and what never does

`context` objects passed to the logger must never include: raw AI prompt
content containing user data, full row payloads, auth tokens, or session
identifiers beyond a user id. Log entity **ids** and **operation types**
for debuggability, not entity **contents** — see
[SECURITY.md](SECURITY.md) for the fuller data-handling rules this
follows from.
