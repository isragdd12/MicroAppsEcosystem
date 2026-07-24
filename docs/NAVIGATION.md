# Navigation

Expo Router (file-based, built on React Navigation) for every app. This
document covers routing conventions and how navigation interacts with
the feature-based structure from
[REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md).

## Why Expo Router over hand-configured React Navigation

- File-based routes work identically across Android and Web from the same
  route files (React Native Web + Expo Router handles URL sync,
  deep-linking, and browser back/forward for free) — avoids maintaining
  parallel native-stack and Web-router configuration.
- Route structure is visible directly in the file tree, which keeps
  onboarding a new app fast (see [ARCHITECTURE.md](ARCHITECTURE.md)'s
  "optimize for the 2nd-10th app" principle) — no separate navigator
  config file to keep in sync with the screen files.

## Routes are thin; features own the screens

`apps/<app>/app/` contains **only** route files, and each route file's
entire job is importing and rendering one screen component from a
feature:

```tsx
// apps/petcare/app/pet/[id].tsx
import { PetDetailScreen } from '@/features/pets/screens/PetDetailScreen';
import { useLocalSearchParams } from 'expo-router';

export default function PetDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PetDetailScreen petId={id} />;
}
```

No business logic, no repository calls, no hooks beyond reading route
params live in `app/`. This keeps route files trivial to regenerate when
restructuring URLs, and keeps the actual screen implementation testable
in isolation from the router (see [TESTING.md](TESTING.md)) and portable
if a feature ever needs to change which route renders it.

## Standard app shell: tabs + stacks

Every app follows the same top-level shape unless a feature genuinely
requires otherwise:

```
app/
├── _layout.tsx              # root layout: ThemeProvider, QueryClientProvider, auth check
├── (tabs)/
│   ├── _layout.tsx          # Tabs navigator — tab list is app-specific, structure is shared
│   ├── index.tsx            # primary/home tab
│   ├── <feature>.tsx        # one tab per top-level feature area
│   └── settings.tsx         # renders packages/ui's shared SettingsScreen
├── <feature>/[id].tsx       # feature detail routes, pushed from a tab
└── auth/
    ├── sign-in.tsx           # renders packages/ui's shared AuthScreen
    └── sign-up.tsx
```

Which features get their own top-level tab vs. live nested inside another
tab's flow is a per-app product decision (e.g. Pet Care might have
Pets/Feeding/Settings tabs; a simpler app might have just Home/Settings)
— the _shape_ of "tabs at the root, stacks within each tab" is the shared
convention, not the specific tab list.

## Auth-gated routing

The root `_layout.tsx` checks session state (from `packages/auth`) and
redirects to `auth/sign-in` **only** for routes that require an account
(sync settings, subscription management) — per the "auth is optional"
decision in [ARCHITECTURE.md](ARCHITECTURE.md), the large majority of
routes (all domain features) render regardless of session state. This is
implemented as an Expo Router layout-level guard on the specific nested
layouts that need it (e.g. `app/account/_layout.tsx`), not a single
global gate in front of the whole app.

## Deep linking

Expo Router's file-based routes are deep-linkable by default
(`petcare://pet/abc123` and, on Web, `https://petcare.app/pet/abc123`
resolve to the same route). Used for: push notification taps (open the
relevant reminder's detail screen) and, on Web, ordinary shareable URLs.
No separate deep-link configuration to maintain — this falls out of the
route structure for free, which is part of why file-based routing was
chosen over a hand-built navigator.

## Navigation and the sync engine

Navigating to a detail screen never itself triggers a network fetch — the
screen reads local SQLite (via the feature's hook/repository) exactly as
it would offline. See [SYNC_ENGINE.md](SYNC_ENGINE.md).

## Cross-feature navigation

A screen in one feature occasionally needs to navigate into another
feature (e.g. a Pet's detail screen linking to "Log a feeding," which
belongs to the `feeding` feature). This is done via Expo Router's
`router.push('/feeding/log?petId=...')` — a route-string reference, not a
direct import of another feature's screen component. Features may be
navigated _to_ by route, but should not import each other's internals
directly; this keeps features independently deletable/reworkable, per the
feature-isolation rationale in
[REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md). If two features need
to share actual logic (not just navigate to each other), that logic
belongs in a shared package or in `apps/<app>/components|utils`, not in
one feature importing from another's `features/` folder.
