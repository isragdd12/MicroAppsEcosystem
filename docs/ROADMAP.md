# Roadmap

This is the implementation order for Phase 4. Each milestone is completed
fully — tests passing, lint clean, docs updated, changes committed — before
the next begins, per the workflow in the project's top-level instructions.
Nothing here is implemented until the docs in this `docs/` directory are
reviewed and approved.

## Milestone 0 — Monorepo skeleton

- `pnpm-workspace.yaml`, root `package.json`, `turbo.json`,
  `tsconfig.base.json`.
- `packages/config` (shared tsconfig/eslint/jest configs).
- Empty `packages/{ui,theme,data,sync,ai,auth,notifications,validation,logger}`
  scaffolds — package.json + tsconfig + empty `src/index.ts` each, so the
  workspace graph exists before it's filled in.
- GitHub Actions CI skeleton (install → lint → typecheck → test → build),
  green on an empty repo.
- **Exit criteria:** `pnpm install`, `turbo run lint typecheck test build`
  all succeed with nothing but scaffolding.

## Milestone 1 — Supabase project + local dev stack

- Create the Supabase project (real account setup — see
  [SUPABASE.md](SUPABASE.md)).
- `supabase/` directory, local dev stack running via Supabase CLI.
- `public` schema: `users`, `subscriptions` tables + RLS.
- Auth configured (email/password + one OAuth provider).
- **Exit criteria:** can sign up/sign in against the local Supabase stack
  from a throwaway script; RLS policies have at least a smoke test
  confirming cross-user isolation.

## Milestone 2 — `packages/data`, `packages/sync`, `packages/logger`, `packages/validation`

- Generic `Repository<T>` base class, SQLite client setup, migration
  runner (see [DATABASE.md](DATABASE.md), [SQLITE.md](SQLITE.md)).
- Sync engine: outbox, push/pull loop, last-write-wins conflict
  resolution (see [SYNC_ENGINE.md](SYNC_ENGINE.md)) — built and unit
  tested against a generic fixture table, no real app yet.
- `Logger` interface + console implementation (see
  [ERROR_HANDLING.md](ERROR_HANDLING.md)).
- Shared Zod helper utilities (see [DATABASE.md](DATABASE.md)).
- **Exit criteria:** a fixture entity can be created locally, pushed,
  pulled on a second "device" (second local DB instance in a test), and a
  conflict between the two resolves correctly — all under test, per
  [TESTING.md](TESTING.md)'s priority order.

## Milestone 3 — `packages/theme`, `packages/ui` (primitives only)

- Theme token contract + `ThemeProvider` (see
  [THEME_SYSTEM.md](THEME_SYSTEM.md)).
- Core primitives: Button, TextInput, Card, List/ListItem, Screen layout
  wrapper, Spinner, EmptyState/ErrorState, Toast (see
  [UI_SYSTEM.md](UI_SYSTEM.md), [COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md)).
- A minimal default theme + a tiny throwaway harness app (or Expo's
  preview tooling) to visually verify primitives in light/dark on Web and
  Android before any real app consumes them.
- **Exit criteria:** primitives render correctly in light/dark, on Web
  and Android, against the default theme.

## Milestone 4 — Pet Care skeleton: auth-optional shell, no features yet

- `apps/petcare/` scaffolded per [REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md):
  `app/` routing shell (tabs + auth stack), `theme/` (Pet Care branding),
  `config/` (env schema).
- Shared `Settings`, `Auth`, `Profile` screens wired in from
  `packages/ui` (see [UI_SYSTEM.md](UI_SYSTEM.md)).
- Sign-in optional end-to-end: app boots and is navigable fully signed
  out; signing in works against the local Supabase stack.
- **Exit criteria:** app runs on Web and Android, boots offline, sign-in/
  sign-up work, Settings/Profile render from shared config-driven
  screens.

## Milestone 5 — First real feature: `pets` (CRUD, no AI yet)

- `features/pets/`: schema, migrations, `PetRepository`, `usePets`/
  `useCreatePet`/etc. hooks, `PetsListScreen`, `PetDetailScreen`,
  `AddPetScreen`.
- Postgres mirror table + RLS for `petcare.pets`.
- Full offline create/edit/delete works locally; syncs to Supabase when
  signed in; syncs back down on a second simulated device.
- **Exit criteria:** this is the first feature built entirely per the
  UI → hook → repository → SQLite → sync → Supabase layering — treat it
  as the reference example the next feature copies the shape from.

## Milestone 6 — Second feature: `feeding` (proves cross-feature patterns)

- `features/feeding/`: feed logging referencing `pets`, local
  notifications for reminders (see [TECH_STACK.md](TECH_STACK.md)).
- Exercises cross-feature navigation (Pet detail → "log a feeding," see
  [NAVIGATION.md](NAVIGATION.md)) without cross-feature imports.
- First real signal on whether any `apps/petcare/components/` (app-wide,
  cross-feature) components are needed yet.
- **Exit criteria:** two features coexist cleanly; any component reuse
  pressure observed here informs what (if anything) gets promoted.

## Milestone 7 — Media sync (`pets`/`feeding` photos)

- Local capture (`expo-image-picker`), Supabase Storage sync, per
  [SYNC_ENGINE.md](SYNC_ENGINE.md)'s media sync design.
- **Exit criteria:** a photo taken offline appears on a second signed-in
  device after both sync.

## Milestone 8 — AI: `packages/ai` + first real insight feature

- Provider adapter(s) behind the `AiProvider` interface, `ai-proxy` Edge
  Function (see [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md)).
- One real AI feature in Pet Care (e.g. feeding pattern insight) built
  fully per the structured-query-and-summarize pattern.
- **Exit criteria:** feature works end-to-end with a real (cheap-tier)
  provider; failure/rate-limit paths degrade gracefully per
  [ERROR_HANDLING.md](ERROR_HANDLING.md).

## Milestone 9 — Monetization

- RevenueCat integration, `petcare` app entitlement product(s),
  webhook → `public.subscriptions` sync (see [SUPABASE.md](SUPABASE.md)).
- **Exit criteria:** a purchase (sandbox) correctly gates a premium
  feature, and the entitlement is usable offline once synced once.

## Milestone 10 — Push notifications for signed-in users

- `push-dispatch` Edge Function + Expo Push integration (see
  [SUPABASE.md](SUPABASE.md), [ARCHITECTURE.md](ARCHITECTURE.md)).
- **Exit criteria:** a scheduled reminder fires as a push notification for
  a signed-in user with the app backgrounded.

## Milestone 11 — EAS Build/Submit + CI/CD for release

- `eas.json` build profiles: `development`, `preview`, `production`, for
  Android + Web.
- GitHub Actions workflow triggering EAS builds on release tags/`main`
  merges (kept separate from the fast PR-check pipeline in
  [CODING_STANDARDS.md](CODING_STANDARDS.md)).
- Google Play Console app entry + internal testing track.
- **Exit criteria:** a tagged release produces an installable Android
  build via EAS and a deployed Web build, without manual steps beyond
  approving the release.

## Milestone 12 — Pet Care polish + store submission prep

- Store listing assets, privacy policy (standard PII disclosure, per
  [SECURITY.md](SECURITY.md) scope), accessibility pass, remaining
  features per product scope decided at the time.

## After Pet Care ships: platform extraction checkpoint

Before starting app #2, do a deliberate pass promoting anything from Pet
Care's `apps/petcare/components|utils` that's now obviously reusable into
`packages/ui`/elsewhere — per the "rule of three" in
[COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md), this is the first
point where real promotion decisions can be made with actual evidence
rather than guesses. Then scaffold app #2 (Gardening, per current
product plan) and treat the ease (or difficulty) of that scaffolding as
the real test of whether Milestones 0–3's shared packages did their job.

## Explicitly deferred (not roadmapped yet, revisit later)

- iOS build target.
- Field-level sync conflict merging.
- RAG/embeddings-based AI context.
- Generic schema-driven domain screen renderer.
- E2E device automation (Detox/Maestro).
- Third-party error tracking service activation (Sentry or similar) —
  interface exists from Milestone 2 onward, provider plugged in whenever
  production error volume justifies it.
- CRDT or vector-clock based sync — only if a future app's collaboration
  requirements (e.g. shared real-time D&D campaign editing) genuinely
  need it; see [SYNC_ENGINE.md](SYNC_ENGINE.md).
