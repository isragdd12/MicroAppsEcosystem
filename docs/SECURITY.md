# Security

## Scope

Per the Phase 1 interview: standard PII sensitivity (names, notes,
photos), no regulated data (health/financial/HIPAA-class). Standard
Supabase-provided encryption in transit/at rest plus disciplined
application-layer practices are sufficient — no special compliance
regime is designed for. This document still treats security seriously
within that scope; "not regulated" is not "not careful."

## Threat model, briefly

The realistic risks for this system are: (1) one user accessing another
user's data due to a missing/broken authorization check, (2) leaked
credentials/API keys, (3) client-side data exposure on a shared/lost
device, (4) injection-style bugs in the small amount of server code that
exists (Edge Functions). There is no admin panel, no third-party
integrations processing payment data directly (RevenueCat/Stripe handle
that, see [TECH_STACK.md](TECH_STACK.md)), and no user-generated content
rendered as HTML/executed as code — this significantly narrows what
needs active defense.

## Authorization: RLS is the real boundary

Even though the UI never queries Supabase directly, **Row Level Security
is not optional or secondary** — see [SUPABASE.md](SUPABASE.md). It's the
actual enforcement point because Edge Functions and the sync engine's
push/pull requests hit Postgres with a user's session, not with a
trusted-server bypass. A bug in an Edge Function that forgets to filter
by `owner_id` is caught by RLS instead of leaking data — application-code
checks are a UX nicety, RLS is the guarantee. Every new table must ship
its RLS policies in the same migration that creates it, never added
later "once it matters."

## Secrets

| Secret                     | Where it lives                                                               | Never lives                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| LLM provider API keys      | Supabase Edge Function environment variables                                 | Client bundle, git history, `packages/ai`                                                                    |
| Supabase service-role key  | CI secrets (for migrations/admin scripts only)                               | Client bundle, Edge Functions that handle user requests (those use the user's own session, not service role) |
| RevenueCat/webhook secrets | Edge Function environment variables                                          | Client bundle                                                                                                |
| User session tokens        | `expo-secure-store` (device keychain/keystore-backed)                        | SQLite, AsyncStorage, plain files                                                                            |
| Supabase anon/public key   | Client bundle (this one is meant to be public — RLS is what makes that safe) | —                                                                                                            |

The Supabase **service-role key** (which bypasses RLS) is never used in
any code path that serves a user request — it exists only for
CI/migration tooling run by the developer, never inside an Edge Function
that a client calls.

## Client-side data at rest

SQLite database files are not separately encrypted beyond the OS-level
disk encryption already present on modern Android devices — consistent
with the "standard PII, no special sensitivity" scope decision. If a
future app's data justifies stronger protection, `expo-sqlite`'s SQLCipher
support (or per-field encryption for specific columns) is the documented
upgrade path, applied to that app only rather than adopted wholesale
"just in case." This is a conscious tradeoff, not an oversight: added
encryption has real cost (key management, recovery-on-reinstall
complexity) that isn't justified by the current data sensitivity.

## Transport security

All Supabase communication (Postgres via PostgREST/RPC, Storage, Edge
Functions, Auth) is over TLS by default — no custom networking code
bypasses this. AI provider calls happen server-side (Edge Function →
provider API), also over TLS, and the client never has a direct network
path to any LLM provider.

## Input validation as a security boundary, not just a UX one

Every repository write validates against its Zod schema (see
[DATABASE.md](DATABASE.md), [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md))
_before_ the value can reach SQLite and, later, Postgres via sync. Edge
Functions independently re-validate their inputs (never trust that
client-side validation was actually applied — a malicious or buggy client
could send anything) using the same Zod schemas, shared via
`packages/validation` so client and server validation can never silently
drift apart.

## AI-specific data handling

Per [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md), only summarized, minimal
context is sent to the LLM provider — not raw database dumps. This is a
privacy property as much as a cost one: the LLM provider only ever sees
the specific fields a given prompt template actually needs, not a user's
full record set. Prompt templates should be reviewed for over-inclusion
(don't pass a field into the context object just because it's
convenient) as part of ordinary code review for any AI feature.

## Authentication

Supabase Auth handles password hashing, session issuance, and refresh —
no custom auth logic is written. Sessions are short-lived access tokens +
refresh tokens per Supabase's standard model, stored in
`expo-secure-store`. Because auth is optional (see
[ARCHITECTURE.md](ARCHITECTURE.md)), unauthenticated usage has no session
at all — there is no "guest session token" to protect, simplifying that
path considerably.

## Dependency and platform hygiene

- `pnpm audit` run in CI (see [CODING_STANDARDS.md](CODING_STANDARDS.md))
  to catch known-vulnerable dependencies before they reach a release.
- Expo/EAS keeps native build tooling current; Expo SDK upgrades are
  tracked as routine maintenance (see [ROADMAP.md](ROADMAP.md)) rather
  than deferred indefinitely, since falling far behind compounds upgrade
  risk.

## What's explicitly deferred

Rate limiting beyond the basic per-user AI request cap
([AI_ARCHITECTURE.md](AI_ARCHITECTURE.md)), formal penetration testing,
and SOC2-style compliance tooling are not part of v1 — appropriate for a
solo developer's early-stage product, revisit if/when user scale or a
specific app's data sensitivity changes the calculus (see
[ROADMAP.md](ROADMAP.md)).
