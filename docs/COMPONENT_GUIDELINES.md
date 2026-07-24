# Component Guidelines

Practical rules for where a component belongs and how it should be
built. Complements [UI_SYSTEM.md](UI_SYSTEM.md) (the kit's scope and
structure) and [REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md) (the
feature-based app layout).

## Where does this component go? Decision tree

1. **Does it reference any domain concept** (a "pet," a "feeding," a
   D&D "campaign") in its name, props, or types?
   - Yes → it does not belong in `packages/ui`. Go to step 2.
   - No → candidate for `packages/ui`, but see the "rule of three" below
     before actually moving it there.
2. **Is it used by more than one feature within the same app?**
   - Yes → `apps/<app>/components/` (app-wide, cross-feature, but still
     app-specific — e.g. a `SpeciesBadge` used by both `pets` and
     `medications`).
   - No → `apps/<app>/features/<feature>/components/` (belongs to one
     feature only).

## The rule of three: don't promote to `packages/ui` speculatively

A component moves to `packages/ui` only when a **second app** actually
needs it, not when you predict a second app might. Writing a generic
`Card` before Pet Care even has two kinds of cards is guessing at an
abstraction with one data point — exactly the premature genericization
[ARCHITECTURE.md](ARCHITECTURE.md) warns against. In practice:

- Building Pet Care: components live in `apps/petcare/...` even if you're
  fairly sure they're generic.
- Building the second app (Gardening): when you reach for something that
  clearly duplicates a Pet Care component, promote _that_ component to
  `packages/ui`, generalizing its props based on the two real call sites
  you now have — then update Pet Care to import the shared version
  instead of its local copy.
- This means `packages/ui` grows mostly during each new app's build-out,
  not upfront. That's expected and correct.

The exception: primitives that are obviously universal from long-standing
UI convention (Button, TextInput, Card, Spinner) can be built directly in
`packages/ui` from the start — the "rule of three" is about avoiding
guessed abstractions, not about refusing to build a button component
until two apps ask for one.

## Building a new `packages/ui` primitive: checklist

- [ ] Props are the only configuration surface — no imports from any app,
      no conditionals on app identity (see [UI_SYSTEM.md](UI_SYSTEM.md)).
- [ ] All colors/spacing/typography/radii come from `useTheme()`, never
      hardcoded literals.
- [ ] Works on both Android and Web without a platform-specific fork of
      the public API (internal `Platform.OS` branches are fine).
- [ ] Has a sensible default `accessibilityRole` and computes
      `accessibilityLabel` from visible text unless overridden.
- [ ] Meets minimum touch target size (44x44 pt) for any interactive
      element.
- [ ] Supports both light and dark theme without special-casing — this
      falls out for free if it only reads theme tokens.
- [ ] Exported from `packages/ui/src/index.ts` (and only from there).
- [ ] Has at least a basic render/interaction test (see
      [TESTING.md](TESTING.md)).

## Composition over configuration explosion

If a primitive's prop surface starts accumulating booleans that toggle
unrelated concerns (`showIcon`, `showBadge`, `compact`, `withFooter`,
...), prefer composition instead — accept `children` or named slot props
(`leading`, `trailing`) so callers assemble variations instead of the
primitive trying to anticipate every combination. This keeps the
primitive's own logic simple and keeps genuinely app-specific
combinations out of the shared component.

## Composition over inheritance

There is no class-based component inheritance in this codebase.
"Composition over inheritance" here means: build complex UI by nesting
simple primitives and feature components, not by creating base classes or
deeply specialized component variants. A `PetCard` in the `pets` feature
is `<Card><Avatar/><Stack>...</Stack></Card>`, not a subclass of `Card`.

## Reusable interactive elements (sliders, graphs, etc.)

The prompt's example — sliders, interactive graphs, and similar rich
controls — follows the same rule as any other primitive: build the
_mechanism_ generically in `packages/ui` (a `Slider` that takes
`min/max/step/value/onChange` and theme tokens; a `Chart` that takes a
generic `{ x, y }[]` data shape and a set of series configs), and keep
_what data feeds it_ entirely in the feature. A weight-tracking chart in
Pet Care and a plant-growth chart in Gardening should be the same
`packages/ui` `Chart` component, fed different data and series config
from each feature — never two separate chart implementations.

## Whole-screen reuse (Settings-style)

Per [ARCHITECTURE.md](ARCHITECTURE.md), only screens that are
**structurally identical** across every app (Settings, Auth, Profile) are
built as shared, config-driven screens in `packages/ui/src/screens/` —
see [UI_SYSTEM.md](UI_SYSTEM.md) for how they stay generic via a config
prop rather than forking. Domain screens (Feeding Log, Session Notes) are
never forced into this pattern — they're real, separate implementations
per feature, assembled from shared primitives. Forcing a generic
"CollectionListScreen" onto every list-shaped domain screen is exactly
the premature schema-driven-renderer trap called out as explicitly out of
scope in [ARCHITECTURE.md](ARCHITECTURE.md); revisit only once several
apps' list screens reveal a genuinely identical shape worth extracting.

## Naming conventions

- Components: `PascalCase`, named for what they are, not where they're
  used (`Card`, not `PetCardContainer`).
- Feature components that wrap a primitive for one domain use a
  domain-prefixed name (`PetCard`, `FeedingListItem`) so it's
  unambiguous, scanning a feature folder, which components are
  feature-specific vs. re-exported primitives.
- Props: boolean props read as an assertion (`disabled`, not `isDisabled`
  — pick one convention and apply it consistently; see
  [CODING_STANDARDS.md](CODING_STANDARDS.md)).
