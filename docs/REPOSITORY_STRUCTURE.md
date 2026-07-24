# Repository Structure

## Monorepo tool: pnpm workspaces + Turborepo

**pnpm workspaces** for dependency management: strict node_modules layout
(no phantom dependencies — a package can only import what it explicitly
depends on), fast installs via content-addressable storage, and official
Expo support. **Turborepo** for task orchestration: caches `lint`/`test`/
`typecheck`/`build` outputs per package so a change in one app doesn't
re-run checks across the whole monorepo, and defines the task dependency
graph (e.g. `build` depends on the `build` of its workspace dependencies).

## Top-level layout

```
MicroAppsEcosystem/
├── apps/
│   ├── petcare/
│   ├── gardening/              (added later)
│   └── dnd-campaign/           (added later)
├── packages/
│   ├── ui/                     # shared component kit
│   ├── theme/                  # theme tokens + ThemeProvider
│   ├── data/                   # repository base classes, SQLite client, migrations runner
│   ├── sync/                   # sync engine (queue, push/pull, conflict resolution)
│   ├── ai/                     # AI client abstraction + provider adapters
│   ├── auth/                   # Supabase auth wrapper, session state
│   ├── notifications/          # local + push notification helpers
│   ├── validation/             # zod schemas shared across apps (base entities)
│   ├── config/                 # shared tsconfig, eslint config, jest config
│   └── logger/                 # error/logging abstraction (see ERROR_HANDLING.md)
├── supabase/
│   ├── migrations/             # SQL migrations (source of truth for Postgres schema)
│   ├── functions/              # Edge Functions (ai-proxy, push-dispatch, etc.)
│   └── config.toml
├── docs/
│   └── (this directory)
├── .github/
│   └── workflows/              # CI pipelines, see CODING_STANDARDS.md / ROADMAP.md
├── turbo.json
├── pnpm-workspace.yaml
├── package.json                # root: shared devDependencies + scripts only
└── tsconfig.base.json
```

## `apps/<app-name>/` internal layout: feature-based

Domain logic is organized by **feature**, not by technical layer. Every
app is a standalone Expo Router app whose `app/` routes are thin — they
render a screen from a feature and do nothing else. Example for
`apps/petcare/`:

```
apps/petcare/
├── app/                          # Expo Router file-based routes (thin — no logic)
│   ├── (tabs)/
│   │   ├── index.tsx             # renders <PetsListScreen />
│   │   ├── feeding.tsx           # renders <FeedingLogScreen />
│   │   └── settings.tsx          # renders shared Settings screen from packages/ui
│   ├── pet/[id].tsx              # renders <PetDetailScreen />
│   └── _layout.tsx
├── features/
│   ├── pets/
│   │   ├── screens/              # PetsListScreen, PetDetailScreen
│   │   ├── components/           # PetCard, PetAvatar — used only within this feature
│   │   ├── hooks/                # usePets(), useCreatePet(), useDeletePet()
│   │   ├── repository/           # PetRepository (extends packages/data's base Repository)
│   │   ├── db/                   # this feature's SQLite table definitions + local migrations
│   │   ├── validation/           # zod schemas: Pet, CreatePetInput...
│   │   └── ai/                   # prompt templates + summarizers specific to Pets
│   ├── feeding/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── hooks/                # useFeedPet(), useFeedingHistory()
│   │   ├── repository/           # FeedRepository
│   │   ├── db/
│   │   └── validation/
│   ├── medications/
│   │   └── ...same shape...
│   └── walks/
│       └── ...same shape...
├── theme/                        # this app's theme token overrides + branding assets
├── config/                       # app.config.ts inputs, feature flags, env schema
├── components/                   # app-wide (cross-feature) components not worth promoting to packages/ui
├── utils/                        # app-wide helpers with no home in a specific feature
├── assets/
├── app.config.ts                 # Expo config (name, icon, splash, bundle id)
├── package.json
└── tsconfig.json                 # extends tsconfig.base.json
```

**The layering rule inside every feature is fixed:**

```
UI (screen/component)
   ↓
Feature hook (useFeedPet, usePets, ...)
   ↓
Repository (FeedRepository.add(), PetRepository.list(), ...)
   ↓
SQLite (via packages/data)
   ↓
Sync Queue
   ↓
Supabase
```

A screen **never** calls a repository directly, and a repository **never**
calls SQLite APIs outside `packages/data`'s primitives. The hook is where
feature-specific business logic lives (e.g. `useFeedPet()` knows that
feeding a pet also needs to reschedule the next feeding reminder — that
orchestration is not the repository's job, and it is not the screen's
job). Concretely:

```
FeedPetScreen  →  useFeedPet()  →  FeedRepository.add()  →  SQLite  →  Sync Queue

# not:
FeedPetScreen  →  SQLite.insert()
```

**Why feature-based, not layer-based (`screens/`, `repositories/`,
`domain/` as siblings at the app root):** every architectural decision
here is optimized for the cost of building the _2nd through 10th_ app,
not just Pet Care. A layer-based tree scales badly with feature count —
adding "Medications" means touching four unrelated top-level folders and
hunting for where things go. A feature-based tree means adding
Medications is: add one folder, copy the internal shape from `feeding/`,
done. It also makes a feature deletable/portable as a unit, which matters
once apps accumulate features that get reworked or removed.

**Rule of thumb for `apps/<app>/components/` vs `packages/ui`:** if a
component has zero references to app- or feature-specific concepts (no
"pet", "feeding", etc. in its props/types) and a second app would
plausibly use it as-is, it belongs in `packages/ui`. If it's shared across
this app's features but is still domain-flavored (e.g. a `SpeciesBadge`
used by both `pets` and `medications`), it belongs in `apps/<app>/components/`,
not inside one feature and not in `packages/ui`. Otherwise it stays inside
the one feature that uses it. Don't pre-emptively promote a component to
`packages/ui` before a second _app_ actually needs it — see
[COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md).

**Hard rule:** `packages/*` never contains domain-specific business logic
— no knowledge of "pets," "feedings," or any other app's vocabulary is
ever allowed to leak into a shared package. Packages provide reusable
_infrastructure_: UI components, hooks, base repository classes, sync
engine, AI client, validation helpers, logger. App-specific logic — every
concrete entity, every domain rule, every feature hook — always lives
under `apps/<app>/features/`. See "Packages as internal SDKs" below.

## Adding a new app — target workflow

Adding an app should require, roughly:

1. `apps/<new-app>/` scaffolded from a template (copy `apps/petcare/`'s
   top-level shape — `app/`, `features/`, `theme/`, `config/` — with zero
   features inside).
2. For each feature: create `features/<feature>/` and fill in
   `validation/` (zod schemas), `db/` (SQLite schema + migrations),
   `repository/`, `hooks/`, `screens/`, `components/`.
3. Define Postgres mirror tables + RLS policies in `supabase/migrations/`
   for each feature's syncable entities.
4. Build screens from `packages/ui` components plus this feature's own
   `components/`.
5. Define theme tokens + branding assets in `theme/`.
6. Write AI prompt templates in each feature's `ai/` (reusing
   `packages/ai`'s client).
7. Register the app in EAS (`eas.json` build profile) and CI matrix.

No changes to `packages/*` should be required to add a typical new app or
a typical new feature within an app. If adding one forces a change to a
shared package, that's a signal the package's abstraction was wrong — fix
the abstraction, don't special-case the app/feature inside it.

## Packages as internal SDKs

Every package in `packages/*` is designed and documented as if it were a
published SDK a third-party app developer would consume — not as
"shared folder of stuff that happened to be used twice." Concretely, that
means each package:

- Has a clear, narrow **public API** exported from its root
  (`packages/data/src/index.ts`), with internal modules not exported.
  Consumers import `Repository`, `createSqliteClient`, etc. — never reach
  into `packages/data/src/internal/...`.
- Documents its contract (what it expects from a consumer, what it
  guarantees back) independent of any one app — e.g.
  [DATABASE.md](DATABASE.md)'s description of `Repository<T>` should make
  sense to someone who has never heard of Pet Care.
- Takes app-specific behavior as **configuration or generics**, never as
  conditional logic keyed on app/feature name. `packages/data`'s
  `Repository<T>` is generic over the entity type; it must never contain
  an `if (tableName === 'pets')`-shaped branch. If a package needs an
  escape hatch, it's a constructor parameter or a passed-in schema, not a
  special case.
- Is independently testable without booting a full app — see
  [TESTING.md](TESTING.md).
- Changes to a package's public API are treated like a breaking SDK
  change: check (or at least consider) every app that imports it, don't
  assume a "local" edit is free just because everything lives in one repo.

This standard is what keeps the promise in [ARCHITECTURE.md](ARCHITECTURE.md)
honest: that adding the 10th app is cheap specifically because the
platform underneath it is solid, generic infrastructure — not an
accumulation of Pet-Care-shaped assumptions.

## Why this shape

- **`packages/data` vs per-app `src/db/`**: the SQLite _client_, migration
  _runner_, and base `Repository` class are generic and shared. The actual
  _schema_ (tables/columns) is inherently app-specific (Pet Care's tables
  have nothing to do with D&D's), so schema and migrations live in the
  app. This mirrors the "shared components, app-specific screens" decision
  from [ARCHITECTURE.md](ARCHITECTURE.md) applied to data.
- **`supabase/` at the root, not per-app**: one Supabase project hosts all
  apps (see [SUPABASE.md](SUPABASE.md) for schema-per-app isolation via
  Postgres schemas + RLS). Keeping migrations centrally makes cross-app
  concerns (shared `users`/`subscriptions` tables) coherent.
- **`packages/config`**: avoids every app/package re-declaring the same
  `tsconfig`/`eslint`/`jest` boilerplate; see [CODING_STANDARDS.md](CODING_STANDARDS.md).
