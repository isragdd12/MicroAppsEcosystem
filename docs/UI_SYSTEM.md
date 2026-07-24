# UI System

`packages/ui` is the shared component kit every app builds on — designed
and versioned as an internal SDK (see [REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md)),
not as a folder of components that happened to be reused. This document
covers the kit's scope, structure, and design rules. Theming specifics
are in [THEME_SYSTEM.md](THEME_SYSTEM.md); routing in
[NAVIGATION.md](NAVIGATION.md); the reuse decision tree in
[COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md).

## Scope: what lives in `packages/ui`

Two categories only:

1. **Primitive components** — Button, TextInput, Card, List, ListItem,
   Avatar, Badge, Sheet/Modal, Toast, Spinner, EmptyState, Slider,
   Switch, Checkbox, Chip, Tabs, DatePicker, IconButton. Configurable
   purely through props, theme tokens, and children — zero knowledge of
   any app's domain.
2. **Universal screens** — Settings, Auth (sign in/up/forgot password),
   Profile/Account. These are screens where the _content_ is genuinely
   identical in shape across every app (a settings list, a login form)
   and only theme/copy/data differ. See "Universal screens" below for how
   these stay generic despite being full screens.

**Everything else — every domain screen, every domain-flavored
component — lives in the app**, under
`apps/<app>/features/<feature>/{screens,components}/` per
[REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md). A "Feeding Log" list
is built _from_ `packages/ui`'s `List`/`ListItem`, but the Feeding Log
screen itself is not a shared component — it doesn't generalize to
Gardening.

## Package structure

```
packages/ui/
├── src/
│   ├── primitives/         # Button, Card, TextInput, ...
│   ├── layout/              # Stack, Row, Screen (safe-area + scroll wrapper), Spacer
│   ├── feedback/             # Toast, Spinner, EmptyState, ErrorState
│   ├── forms/                 # FormField (wires react-hook-form + a primitive + error text)
│   ├── screens/                # Settings, Auth, Profile — universal screens
│   ├── hooks/                   # useTheme, useBreakpoint, useHaptics, etc.
│   └── index.ts                  # the ONLY public entrypoint — see below
├── package.json
└── tsconfig.json
```

Only `src/index.ts`'s exports are the package's public API. Internal
modules are not exported and are not meant to be imported by path from
consuming apps (enforced by ESLint's `no-restricted-imports` — see
[CODING_STANDARDS.md](CODING_STANDARDS.md)). This is what "designed as an
SDK" means concretely: consumers see `import { Button, Card } from
'@microapps/ui'`, never `'@microapps/ui/src/primitives/Button'`.

## Configuration surface: props + theme, never app conditionals

Every primitive takes its variation through **props** (`variant="primary"
| "secondary" | "ghost"`, `size="sm" | "md" | "lg"`) and **theme tokens**
(colors, spacing, radii — see [THEME_SYSTEM.md](THEME_SYSTEM.md)). A
primitive must never contain a conditional keyed on which app is
rendering it (`if (appId === 'petcare')`) — if Pet Care and Gardening
need visibly different button shapes, that's a theme token difference
(`radii.button`), not a code branch. This is the same discipline as
`packages/data`'s `Repository<T>` never branching on table name.

## Universal screens stay generic via config, not forking

The shared `Settings` screen (for example) renders a list of sections
built from a config object the app supplies:

```ts
<SettingsScreen
  sections={[
    { title: 'Account', items: [/* ... */] },
    { title: 'Notifications', items: [/* ... */] },
    { title: 'About', items: [{ label: 'Version', value: appVersion }] },
  ]}
/>
```

The app assembles this config (in `apps/<app>/config/` or the relevant
feature) and passes it in; `packages/ui`'s `SettingsScreen` only knows how
to render "a list of sections of items," never anything about what a
specific app puts in them. The same pattern applies to `AuthScreen`
(app supplies branding + which OAuth providers are enabled) and
`ProfileScreen`.

## Cross-platform (Web + Android) rules

- Built on React Native primitives (`View`, `Text`, `Pressable`, ...) so
  React Native Web compiles them to Web equivalents automatically — no
  parallel Web-specific component tree.
- Any component that needs genuinely different interaction affordances
  per platform (e.g. hover states meaningfully exist on Web, not on
  Android) branches on `Platform.OS` _inside_ the shared primitive, not
  by forking the component — the public API stays identical across
  platforms.
- Touch targets, spacing, and font sizes default to mobile-appropriate
  values and are not auto-scaled up for Web; Web-specific layout
  adjustments (e.g. max content width on large viewports) are handled by
  layout components (`Screen`, `Stack`), not by primitives.

## Accessibility baseline

Every primitive ships with sensible accessibility defaults (correct
`accessibilityRole`, `accessibilityLabel` derived from visible text unless
overridden, minimum touch target size, focus order that matches visual
order) so that accessibility is a property of using `packages/ui`
correctly, not something each app re-implements. See
[COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md) for the checklist
applied when adding a new primitive.

## Versioning and change discipline

Changes to `packages/ui`'s public API are treated like a breaking SDK
change (per [REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md)): check
every app that imports the changed component before merging. Since this
is a single-developer monorepo (not a published package with external
consumers), there's no formal semver contract — but the review discipline
matters more, not less, once several apps depend on the same primitive,
since a careless change is felt everywhere at once.
