# Tech Stack

## Frontend

| Concern         | Choice                      | Why                                                                                                                                                                                                                                               |
| --------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App framework   | React Native (via Expo)     | Single codebase for Android + Web (and future iOS) matches the "shared platform, many apps" goal.                                                                                                                                                 |
| Tooling/runtime | Expo (managed, SDK 51+)     | Handles native build complexity (EAS), OTA updates, and a large first-party module ecosystem (SQLite, Notifications, ImagePicker, SecureStore) so we're not maintaining native code by hand.                                                      |
| Routing         | Expo Router                 | File-based routing that works identically across Web and native; avoids hand-rolling a separate web router and a React Navigation tree.                                                                                                           |
| Web target      | React Native Web (via Expo) | Ships the Web build from the same component code as Android, honoring "write once" for the shared UI kit.                                                                                                                                         |
| Language        | TypeScript, strict mode     | Catches whole classes of bugs (null handling, shape mismatches between SQLite rows and domain types) at compile time — valuable given the amount of data-shape translation (SQLite ↔ domain ↔ Postgres ↔ AI prompt context) in this architecture. |

## Backend

| Concern          | Choice                         | Why                                                                                                                                                                                                             |
| ---------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend platform | Supabase                       | Postgres + Auth + Storage + Edge Functions in one managed service, generous free tier appropriate for a solo dev launching multiple small apps, avoids assembling auth/storage/functions from separate vendors. |
| Database         | PostgreSQL (via Supabase)      | Row Level Security gives per-user data isolation at the database layer, not just app-layer checks — important since UI never talks to Supabase directly but Edge Functions and future admin tooling will.       |
| Server logic     | Supabase Edge Functions (Deno) | Used for the AI proxy (keeps LLM API keys server-side) and push notification dispatch. Deployed alongside the DB schema, no separate backend service to host/scale.                                             |

## Local database

| Concern      | Choice                                                | Why                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| On-device DB | Expo SQLite (`expo-sqlite`), used via **Drizzle ORM** | SQLite is mandated by the offline-first design (see [SQLITE.md](SQLITE.md)). Drizzle gives typed schema definitions and typed queries without a heavy runtime, and its migration story maps cleanly onto both SQLite and Postgres — one mental model for schema on both ends of the sync pipe. Kept thin: repositories still own all query logic, Drizzle is not exposed to screens. |

Alternative considered: raw SQL strings with `expo-sqlite`'s driver
directly. Rejected because untyped SQL scattered across repositories is a
maintenance and correctness risk (e.g. silent column-name typos) that
Drizzle removes for a small dependency cost.

## State management

**Choice: Zustand (client/UI state) + TanStack Query (server/async state),
with repositories as the boundary between them and SQLite.**

Justification:

- This app's state splits cleanly into two kinds, and using one tool for
  both usually means fighting it for one of them:
  - **Local UI state** (selected tab, form draft, modal open) — ephemeral,
    doesn't need persistence or caching semantics. **Zustand**: minimal
    boilerplate, no Provider-wrapping ceremony, easy to scope a store per
    screen or share one globally when needed.
  - **Data loaded from SQLite (and, transitively, synced from Supabase)**
    — this is _async, cacheable, invalidatable_ data, which is exactly
    what **TanStack Query** models (`useQuery`/`useMutation` wrapping
    repository calls). It gives us request de-duplication, background
    refetch, and — critically — a clean way to invalidate/refetch screens
    when the sync engine applies a remote change locally (the sync engine
    just calls `queryClient.invalidateQueries` for affected keys).
- Redux/Redux Toolkit was considered and rejected: more boilerplate than
  this project needs, and its normalized-store model duplicates what
  SQLite + TanStack Query's cache already give us — we'd be caching the
  cache.
- React Context alone was rejected for anything beyond theme/auth-session
  (small, rarely-changing values): it causes broad re-renders for
  frequently-changing state and has no built-in async/caching story.

## Validation

**Choice: Zod.**

Justification:

- One schema definition doubles as a TypeScript type (`z.infer<...>`) and
  a runtime validator — needed at multiple real boundaries in this
  architecture: form input, data coming back from SQLite, data coming
  back from Supabase after sync, and data assembled into AI prompt
  context. Fewer chances for the type system to "lie" about a shape that
  isn't actually validated at runtime.
- Wide ecosystem support (works naturally with React Hook Form for forms,
  Drizzle can derive from or validate against Zod shapes) and is already
  the de facto standard in the RN/Expo ecosystem, minimizing a learning
  curve the user would otherwise pay as someone new to this stack.
- Alternative (Yup) was considered; Zod's TypeScript-first inference is a
  better fit given TypeScript strict mode is mandated project-wide.

## Forms

**React Hook Form + `@hookform/resolvers/zod`.** Uncontrolled-by-default
inputs keep form-heavy screens (e.g. "Add Pet") performant, and the Zod
resolver means one schema drives both the form's validation and the
repository's write-time validation.

## Notifications

- **Local**: `expo-notifications` for on-device scheduling (feeding
  reminders, etc.) — works fully offline.
- **Push**: Expo Push Notification service, triggered from a Supabase
  Edge Function on a schedule/trigger, for signed-in users. See
  [SYNC_ENGINE.md](SYNC_ENGINE.md) and [ARCHITECTURE.md](ARCHITECTURE.md).

## Media

`expo-image-picker` + `expo-file-system` for local capture/storage,
synced to **Supabase Storage** in the background by the same sync queue
that handles structured data (see [SYNC_ENGINE.md](SYNC_ENGINE.md)).
`expo-image` for optimized display/caching.

## AI

Provider-agnostic client in `packages/ai`, called only from Supabase Edge
Functions. See [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md) for the full
design and why no specific LLM vendor is hardcoded into the architecture.

## Monetization

**RevenueCat**, per-app subscription products. RevenueCat abstracts over
Apple/Google (and Stripe, for Web) billing so we don't hand-roll receipt
validation, and its entitlement model maps directly onto "per-app
subscription" (see [ARCHITECTURE.md](ARCHITECTURE.md)) — each app checks
its own entitlement, independent of the others.

## Build & delivery

- **EAS Build** — Android and Web build profiles (see [ROADMAP.md](ROADMAP.md)).
- **EAS Update** — OTA JS updates without a store resubmission for
  non-native changes.
- **GitHub Actions** — CI: lint, typecheck, unit tests, build verification
  on every PR/push (see [CODING_STANDARDS.md](CODING_STANDARDS.md)).

## Testing

Jest + React Native Testing Library for unit/component tests, focused per
the "pragmatic" testing philosophy on business logic, repositories, and
the sync engine. Full rationale in [TESTING.md](TESTING.md).

## Error tracking

No third-party service wired in yet (by decision — see
[ERROR_HANDLING.md](ERROR_HANDLING.md)). A provider-agnostic `Logger`
interface in `packages/logger` is used everywhere from day one so Sentry
(or another provider) can be plugged in later without touching call
sites.
