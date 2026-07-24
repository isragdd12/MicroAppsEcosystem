# Testing

## Philosophy: pragmatic, focused on where silent bugs are costly

Per the Phase 1 decision: unit-test business logic, repositories, and the
sync engine thoroughly; skip exhaustive UI/e2e testing for v1. The
reasoning is specific, not just "less testing is easier": a bug in a
button's rendering is visible immediately when you look at the screen. A
bug in conflict resolution or a migration is invisible until it silently
corrupts or loses user data, possibly long after the code shipped. Test
effort is allocated to match that asymmetry.

## What gets unit tested, in priority order

1. **`packages/sync`** — outbox draining, pull application, conflict
   resolution (last-write-wins timestamp logic specifically), retry/
   backoff behavior, anonymous→authenticated re-owning. Highest priority:
   this is the least visible, hardest-to-debug-in-production code in the
   system. See [SYNC_ENGINE.md](SYNC_ENGINE.md).
2. **`packages/data`'s base `Repository<T>`** — CRUD correctness, soft
   delete filtering, sync-queue enqueueing on mutation, validation
   rejection of invalid input.
3. **Feature hooks with orchestration logic** — e.g. `useFeedPet()`
   actually calling both the feed repository and rescheduling a reminder,
   not just one of the two.
4. **Zod schemas** — boundary cases for each entity's validation rules
   (a schema with no test is a schema no one has confirmed actually
   rejects what it should).
5. **`packages/ai`'s request/response handling and error mapping** —
   using recorded fixture responses, not live provider calls (see
   [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md)).

## What gets lighter/no automated testing in v1

- Individual `packages/ui` primitives beyond a basic render+interaction
  smoke test (per the checklist in
  [COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md)) — visual
  correctness is checked by hand during development (see
  [THEME_SYSTEM.md](THEME_SYSTEM.md)'s theme-testing note), not asserted
  in CI.
- Full end-to-end flows (Detox/Maestro-style device automation) — not set
  up for v1. Revisit once the platform has multiple apps and regressions
  in cross-cutting flows (auth, sync) become expensive enough in manual
  QA time to justify the investment (see [ROADMAP.md](ROADMAP.md)).
- Domain screens' visual layout — covered by manual testing per feature
  during development (see the "Doing tasks" UI-testing expectation: run
  the app and click through the golden path before calling a feature
  done), not by automated screenshot tests.

## Test tooling

- **Jest** — test runner, shared config in `packages/config` (per
  [REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md), every package/app
  extends one base Jest config rather than redefining it).
- **React Native Testing Library** — for the feature hooks and any
  component tests that do exist; queries by accessible role/label,
  reinforcing the accessibility defaults from
  [COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md) by making
  inaccessible components awkward to test.
- **In-memory/temp-file SQLite** for repository and sync tests — real
  `expo-sqlite`-compatible behavior via Drizzle's testing setup, not a
  mocked database, since the whole point of testing the data layer is
  catching real SQL/schema bugs.
- **Supabase local dev stack** (via Supabase CLI, see
  [SUPABASE.md](SUPABASE.md)) for the small number of tests that verify
  RLS policies actually enforce isolation — this matters enough
  (security boundary, see [SECURITY.md](SECURITY.md)) to test against
  real Postgres rather than assume the SQL is correct. **Temporarily**,
  per [SUPABASE.md](SUPABASE.md)'s "Local development" note, these run
  against the real remote project instead (Docker not yet set up) —
  `supabase/tests/rls.smoke.test.ts` creates real throwaway auth users on
  each run as a result. Move back to the local stack once available.

## Where tests live

Colocated with the code they test: `*.test.ts` next to the module inside
each feature/package, not a parallel `__tests__/` tree that drifts from
the source it covers. Feature test files live inside the feature they
test (`features/pets/repository/PetRepository.test.ts`), keeping a
feature's tests deletable/portable along with the feature itself — same
rationale as feature-based code organization in
[REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md).

## CI gate

Every PR runs (via Turborepo, so only affected packages/apps actually
re-run — see [TECH_STACK.md](TECH_STACK.md)): typecheck, lint, unit
tests, and a build check. A PR cannot merge with failing tests or
typecheck errors. See [CODING_STANDARDS.md](CODING_STANDARDS.md) for the
full CI pipeline definition.

## Manual testing expectation

For any UI-facing change, the golden path and obvious edge cases are
clicked through in a running instance of the app (Web and/or Android, per
the change) before considering the work done — automated tests here
verify data correctness, not that a feature actually looks and feels
right. This mirrors the general standard already in place for this kind
of work, applied specifically to this project's Web+Android targets.

## Testing new apps and features against this doc

A new feature is considered adequately tested when its repository has
CRUD + validation tests and any orchestration logic in its hooks is
covered — not when a specific coverage percentage is hit. Coverage
percentage is not tracked or gated in v1; it's a poor proxy for "the
risky parts are tested" and encourages testing easy code instead of
important code.
