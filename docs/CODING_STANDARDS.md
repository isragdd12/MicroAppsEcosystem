# Coding Standards

## TypeScript: strict mode everywhere

`tsconfig.base.json` sets `"strict": true` (plus `noUncheckedIndexedAccess`
and `noImplicitOverride`), and every package/app's `tsconfig.json` extends
it without loosening it. Justification: this architecture moves data
through several shape translations per request (SQLite row → domain
entity → sync payload → Postgres row, or repository data → AI prompt
context) — exactly the kind of code where an untyped `any` slipping
through silently produces a runtime bug three layers away from where it
was introduced. The cost of strict mode (some extra annotation work) is
small next to that risk, and worth it even though this is a solo
codebase — future-you debugging a sync issue benefits as much as a
second developer would.

`any` is disallowed by lint rule; an escape hatch, when genuinely needed
(e.g. a third-party type gap), is `unknown` + a narrowing check, not
`any`.

## Formatting & linting: ESLint + Prettier, enforced pre-commit

- **Prettier** — formatting, no configuration debates; default-ish config
  committed once in `packages/config`.
- **ESLint** — `packages/config`'s shared config, extended by every
  app/package. Key custom rules beyond typical recommended sets:
  - `no-restricted-imports` blocking deep imports into a package's
    internals (`@microapps/ui/src/*`) — enforces the "public API only"
    rule from [REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md) and
    [UI_SYSTEM.md](UI_SYSTEM.md).
  - A boundary rule preventing `apps/<app>/features/<a>` from importing
    `apps/<app>/features/<b>` directly (see
    [NAVIGATION.md](NAVIGATION.md)'s cross-feature navigation rule) —
    features may be reached by route, not by import.
  - A boundary rule preventing any `packages/*` module from importing
    from `apps/*` (packages must never depend on app code — the
    dependency direction only goes one way).
- **Husky + lint-staged** — pre-commit hook runs Prettier + ESLint
  (`--fix`) on staged files only, so formatting/lint issues never reach a
  commit, catching them at the cheapest possible point rather than in CI
  minutes later.

## Commit conventions: Conventional Commits

`type(scope): summary` — e.g. `feat(petcare/feeding): add feed reminder
rescheduling`, `fix(sync): resolve tombstone re-apply bug`,
`docs(architecture): update sync conflict section`. Common types: `feat`,
`fix`, `refactor`, `test`, `docs`, `chore`, `perf`. Scope is typically a
package or `app/feature` (`sync`, `petcare/pets`, `ui`) so `git log
--grep`/scoped changelogs stay useful as the number of apps grows — this
matters more here than in a single-app repo, since commit history is one
of the few places "what touched the sync engine recently" is easy to
answer across many apps.

## Naming conventions

- Files: `PascalCase.tsx` for components, `camelCase.ts` for
  everything else (hooks, utils, repositories) — `usePets.ts`,
  `PetRepository.ts`, `PetCard.tsx`.
- Types/interfaces: `PascalCase`, no `I`-prefix (`Pet`, not `IPet`).
- Booleans: `is`/`has`/`should` prefixes for variables and state
  (`isLoading`, `hasError`); bare adjective for component props
  (`disabled`, `loading` — matching common RN/web convention of terse
  prop names) — see [COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md).
- Zod schemas: `PascalCase` + `Schema` suffix (`PetSchema`), inferred type
  drops the suffix (`type Pet = z.infer<typeof PetSchema>`).

## Import order

Enforced by ESLint (`eslint-plugin-import` or equivalent), grouped:
external packages → `@microapps/*` shared packages → app-internal
absolute imports (`@/features/...`) → relative imports — with a blank
line between groups. Mechanical, not a matter of taste, so it's never
worth a manual review comment.

## CI pipeline (GitHub Actions)

Runs on every PR and push to `main`, orchestrated through Turborepo so
only affected packages re-run:

1. Install (`pnpm install --frozen-lockfile`)
2. `turbo run lint`
3. `turbo run typecheck`
4. `turbo run test`
5. `turbo run build` (verifies Web + Android build steps succeed;
   full EAS builds are triggered separately, see [ROADMAP.md](ROADMAP.md))
6. `pnpm audit` (advisory, non-blocking initially — see
   [SECURITY.md](SECURITY.md))

A red CI run blocks merge. Since this is currently a solo-developer
repo, there's no separate required-reviewer gate — CI passing is the
merge bar.

## Documentation upkeep

When a change alters something a `docs/*.md` file describes as a rule or
pattern (not just an implementation detail), that doc is updated in the
same PR — docs describing a decision that's no longer true are worse than
no docs, since they actively mislead. See [ROADMAP.md](ROADMAP.md)'s
milestone process, which includes a documentation-update step after every
milestone.

## Environment configuration

Per-app `.env` files (not committed) validated at startup against a Zod
schema in `apps/<app>/config/env.ts` — a missing/malformed required env
var fails fast at boot with a clear message, rather than surfacing as a
confusing runtime error deep in a network call. `.env.example` files are
committed and kept current, so setting up a new environment (or a new
app) is copy-and-fill, not archaeology.
