# Architecture Overview

## What this is

MicroAppsEcosystem is a monorepo that hosts many independent, single-purpose
mobile/web apps ("micro-apps") — Pet Care, Gardening, D&D Campaign Manager,
Bird Watching, Music Practice, and more over time. Every app shares one
internal platform: the same data layer pattern, sync engine, UI component
kit, theming system, and AI integration layer. Apps differ through theme,
data models, domain screens, branding, and AI prompts — not through
reinvented plumbing.

Pet Care is the **reference implementation**. It is built first and proves
out every architectural decision in this document. Patterns that turn out
to be genuinely reusable get extracted into `packages/`. Patterns that seem
reusable but aren't yet proven stay in the app until a second or third app
confirms the shape.

## Guiding principles

1. **Offline-first, always.** SQLite is the source of truth on-device. The
   UI never talks to Supabase directly. Users should not be able to tell,
   from app behavior, whether they're online.
2. **AI is secondary.** Every app must be fully useful with AI features
   disabled or unreachable. AI reads the user's data to summarize/suggest;
   it never becomes the primary interaction model.
3. **Shared platform, distinct apps.** Only truly universal concerns
   (auth, settings, theming, sync, component kit) are shared code. Domain
   screens are app-specific — resist the urge to generalize until at least
   two or three apps prove the same shape is needed.
4. **Don't build for hypothetical scale.** Design decisions in this v1 are
   scoped to a solo developer shipping a handful of apps to a modest user
   base. Where a decision trades simplicity now for a costlier migration
   later, that tradeoff is called out explicitly rather than silently
   over-engineered around.
5. **No vendor lock-in on AI.** The AI layer is provider-agnostic by
   contract (see [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md)), even though
   cost-efficiency drives the initial provider choice.
6. **Optimize for the 2nd through 10th app, not just the 1st.** Every
   architectural choice is evaluated against "how much work is the next
   app" — not "how little code does Pet Care need." This is why apps are
   organized by feature (see [REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md))
   and why shared packages are held to an internal-SDK standard: it costs
   more up front and pays off starting with the second app.
7. **Maintainability over file count.** A few extra files with a clear,
   consistent shape beat a flatter tree that's cheaper to scaffold once
   but expensive to navigate at app #5. Don't collapse layers to save
   files.

## System diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Expo App)                        │
│                                                                    │
│  ┌───────────┐   ┌──────────────┐   ┌────────────┐   ┌────────┐  │
│  │  Screens   │──▶│ Repositories │──▶│   SQLite    │──▶│  Sync   │ │
│  │ (per app)  │   │ (per domain) │   │ (on-device) │   │ Queue   │ │
│  └───────────┘   └──────────────┘   └────────────┘   └───┬────┘  │
│        ▲                 ▲                                │       │
│        │                 │                                │       │
│  ┌───────────┐   ┌──────────────┐                         │       │
│  │  Shared UI │   │  AI Client   │                         │       │
│  │  Kit +     │   │  (summarize  │                         │       │
│  │  Theme     │   │  local data) │                         │       │
│  └───────────┘   └──────┬───────┘                         │       │
└─────────────────────────┼─────────────────────────────────┼──────┘
                           │                                  │
                           ▼                                  ▼
                 ┌───────────────────┐              ┌──────────────────┐
                 │  Supabase Edge     │              │     Supabase      │
                 │  Function          │──────────────▶│  Postgres + RLS   │
                 │  (AI provider call)│              │  + Storage + Auth │
                 └───────────────────┘              └──────────────────┘
```

## Layers, top to bottom

- **Screens** (`apps/<app>/app/` routes, rendering screens from
  `apps/<app>/features/<feature>/screens/`): Expo Router file-based
  routes are thin and only render a feature screen. Screens compose
  shared components (`packages/ui`) and feature components, and call only
  feature hooks — never a repository or SQLite directly.
- **Feature hooks** (`apps/<app>/features/<feature>/hooks/`): own
  feature-specific business logic and orchestration (e.g. `useFeedPet()`
  writes a feed record _and_ reschedules the next reminder). This is the
  one layer allowed to coordinate multiple repositories.
- **Repositories** (`apps/<app>/features/<feature>/repository/`, built on
  a generic base class from `packages/data`): the only code allowed to
  read/write SQLite. Expose domain methods (`petRepository.create(...)`,
  `petRepository.listActive()`) rather than leaking SQL into screens or
  hooks. See [DATABASE.md](DATABASE.md).
- **SQLite**: on-device source of truth. See [SQLITE.md](SQLITE.md).
- **Sync Queue**: durable, ordered log of local mutations waiting to be
  pushed to Supabase, plus the puller that applies remote changes locally.
  See [SYNC_ENGINE.md](SYNC_ENGINE.md).
- **Supabase**: Postgres (durable multi-device store), Auth, Storage
  (media), and Edge Functions (AI proxy, push notification dispatch). See
  [SUPABASE.md](SUPABASE.md).
- **AI Client → Edge Function → LLM provider**: app never calls an LLM
  directly. See [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md).

## Why offline-first, and what it costs

Local-first is the right default for personal data apps: it's fast, works
on a plane, doesn't create a hard dependency on your backend staying up,
and lets us ship without requiring account creation (matching the
"optional auth" decision below). The cost is real: every write goes
through a queue instead of a direct API call, conflict resolution has to
be designed rather than assumed, and testing surface roughly doubles
(local-only path, sync path, conflict path). We accept that cost once, in
shared packages, so each new app doesn't pay it again.

## Why auth is optional, not required

Users can use any app fully — create records, get local reminders — without
ever signing in. An account unlocks three things only: cross-device sync,
subscriptions, and reliable server-side push reminders. This means the
local SQLite schema and the repository layer must work identically whether
or not a `user_id`/session exists, and the sync queue must be a no-op until
a session appears. See [SYNC_ENGINE.md](SYNC_ENGINE.md) for how anonymous
→ authenticated transition works (local data gets attached to the account
on first sign-in, it is not lost).

## Why last-write-wins for conflicts

Field-level merge is more "correct" but is meaningfully more complex to
implement and to reason about, and for single-user personal data (a pet's
weight, a garden bed's watering schedule) the realistic conflict rate is
low and the cost of an occasional overwritten edit is low. We use
server-received timestamp (not device clock, which can't be trusted) as
the tiebreaker. This is documented as a deliberate v1 simplification — see
[SYNC_ENGINE.md](SYNC_ENGINE.md) for the upgrade path to field-level merge
if a specific app's usage pattern later demands it.

## Why per-app subscriptions, not one bundle

Each app is a distinct product with its own value proposition and its own
free/paid feature line. A user who only cares about Pet Care shouldn't be
asked to pay for Gardening. This does mean the entitlements/billing layer
must be app-scoped rather than account-scoped — see billing notes in
[SUPABASE.md](SUPABASE.md).

## What's explicitly out of scope for v1

- iOS builds (Web + Android only at launch; the codebase is not blocked
  from adding iOS later, EAS profiles just aren't configured for it yet).
- Field-level sync conflict merging.
- RAG/embeddings-based AI context (structured-query summarization only).
- A generic schema-driven screen renderer for domain data.
- Regulatory-grade data handling (HIPAA, etc.) — standard PII practices
  only, per the interview.

## Related documents

- [REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md) — monorepo layout
- [TECH_STACK.md](TECH_STACK.md) — full stack and library choices with justification
- [DATABASE.md](DATABASE.md) / [SQLITE.md](SQLITE.md) / [SUPABASE.md](SUPABASE.md) — data layer
- [SYNC_ENGINE.md](SYNC_ENGINE.md) — offline sync design
- [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md) — AI provider abstraction
- [UI_SYSTEM.md](UI_SYSTEM.md) / [THEME_SYSTEM.md](THEME_SYSTEM.md) / [NAVIGATION.md](NAVIGATION.md) / [COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md)
- [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)
- [ERROR_HANDLING.md](ERROR_HANDLING.md) / [SECURITY.md](SECURITY.md)
- [TESTING.md](TESTING.md) / [CODING_STANDARDS.md](CODING_STANDARDS.md)
- [ROADMAP.md](ROADMAP.md)
