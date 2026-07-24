# Theme System

Each app has its own colors, icons, typography, and branding **without
changing shared component code** — a component in `packages/ui` renders
differently per app purely because a different theme object flows
through it.

## Package: `packages/theme`

```
packages/theme/
├── src/
│   ├── tokens.ts          # TypeScript types for the token contract (Theme type)
│   ├── defaultTheme.ts    # a complete, valid default theme (used for tests/storybook)
│   ├── ThemeProvider.tsx  # React context provider
│   ├── useTheme.ts        # hook consumed by packages/ui and app code
│   └── index.ts
```

`packages/theme` defines the **shape** of a theme and the plumbing to
provide/consume it. It does not contain any app's actual color values —
those are data, owned by each app.

## Token contract

```ts
interface Theme {
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textMuted: string;
    border: string;
    primary: string;
    primaryText: string;
    secondary: string;
    secondaryText: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    // ...semantic tokens, never raw component-specific names
  };
  typography: {
    fontFamily: { regular: string; medium: string; bold: string };
    size: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    lineHeight: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
  };
  spacing: (multiplier: number) => number; // e.g. spacing(2) = 8
  radii: { sm: number; md: number; lg: number; full: number };
  icons: IconSet; // see "Icons" below
}
```

**Tokens are semantic, not literal.** A primitive asks for
`colors.primary`, never a hardcoded hex or a token named after where it's
used (`petCardBackground` is wrong — that's a component-specific value
masquerading as a theme token, and it breaks the moment a second app's
"primary-colored card" needs the same value under a different name).
If a component needs a value the current token set doesn't have, that's a
signal to extend the shared token contract thoughtfully — not to bypass
it with an inline style.

## Per-app theme definition

```
apps/petcare/theme/
├── colors.ts        # light + dark palettes
├── typography.ts     # app-specific font family, if any
├── icons.ts           # icon set / mapping
├── branding.ts         # app name, logo asset, splash config
└── index.ts             # exports a complete Theme object (light + dark variants)
```

Each app supplies a light and dark `Theme` object conforming to
`packages/theme`'s `Theme` type. Because it's a type-checked contract, an
app literally cannot ship a theme missing a required token — TypeScript
strict mode catches it, not a runtime blank-screen bug in production.

## Light / dark mode

`ThemeProvider` (from `packages/theme`) is configured at the app root
(`apps/<app>/app/_layout.tsx`) with that app's light and dark `Theme`
objects. It follows the OS color scheme by default
(`useColorScheme()`), with an explicit override persisted via the shared
Settings screen (see [UI_SYSTEM.md](UI_SYSTEM.md)) for users who want to
force light/dark regardless of OS setting. Every color token is defined
for both modes — there is no "dark mode not supported for this token"
escape hatch; a token that isn't meaningfully different between modes
just has the same value in both.

## Icons

Apps use different icon styles/sets to reinforce their distinct identity
(e.g. a friendly rounded set for Pet Care vs. a more illustrative set for
D&D). `theme.icons` is a named mapping (`{ pet: PawIcon, calendar:
CalendarIcon, ... }`) — `packages/ui` components reference icons by
**semantic name** (`icons.calendar`), never import a specific icon
library component directly, so swapping an app's whole icon set is a
theme-level change, not a per-component edit.

## Branding beyond color/type/icons

App name, logo, and splash screen are Expo-level config
(`apps/<app>/app.config.ts`) plus a `branding` section of the theme
object (for in-app usage, e.g. a logo shown on the Auth screen). This is
still "theme" in the broad sense used in
[ARCHITECTURE.md](ARCHITECTURE.md) ("apps differ through theme... not
through reinvented plumbing") even though some of it is Expo config
rather than a React token.

## What is explicitly NOT themeable

Layout structure, navigation patterns, and component _behavior_ are not
theme concerns — they're either shared (`packages/ui`'s components behave
identically everywhere) or app-specific code (a feature's screen
composition). Theming answers "what does it look like," never "how does
it behave" — conflating the two is how theme systems become unmanageable
config sprawl. If two apps need a primitive to _behave_ differently
beyond what props already allow, that's a new prop/variant on the
primitive (still zero app-name conditionals — see
[UI_SYSTEM.md](UI_SYSTEM.md)), not a theme escape hatch.

## Testing a theme

A new app's theme is considered complete when: (1) TypeScript accepts it
as a valid `Theme`, (2) it renders correctly against a small fixed
checklist of `packages/ui` primitives in both light and dark mode (a
lightweight visual smoke check, not automated pixel-diffing for v1 — see
[TESTING.md](TESTING.md)).
