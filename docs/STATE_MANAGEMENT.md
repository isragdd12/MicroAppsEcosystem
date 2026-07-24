# State Management

## Choice: Zustand + TanStack Query, split by state kind

State in this architecture is not one undifferentiated blob — it splits
cleanly into two kinds with different lifecycles, and the two tools are
picked because each is the right shape for one kind. See
[TECH_STACK.md](TECH_STACK.md) for the initial justification; this
document covers the concrete usage patterns.

| Kind                 | Examples                                                                          | Tool                                                     |
| -------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Ephemeral UI state   | selected tab, modal open/closed, in-progress form draft, filter/sort selection    | **Zustand**                                              |
| Persisted/async data | anything from a repository (pets, feeding logs, subscription status, sync status) | **TanStack Query** wrapping repository calls             |
| Auth/session, theme  | current session, active theme name                                                | **React Context** (small, rarely-changing, read broadly) |

## Where state lives relative to features

Consistent with the feature-based layout in
[REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md):

- Query hooks live in `apps/<app>/features/<feature>/hooks/`, one hook
  per meaningful read or mutation (`usePets()`, `useCreatePet()`,
  `useFeedPet()`) — never a screen calling `useQuery` inline with a
  repository call embedded in the screen file. This keeps the
  screen-to-data contract discoverable and gives the hook a place to add
  orchestration logic (see [DATABASE.md](DATABASE.md)'s note on hooks
  owning business logic).
- Zustand stores are scoped as narrowly as possible: a store local to one
  screen's file if nothing else needs it, promoted to
  `features/<feature>/state/` only if genuinely shared across that
  feature's screens, and to `apps/<app>/state/` only for truly app-wide
  ephemeral state (rare). Global Zustand stores are the exception, not
  the default.
- `packages/state` (if it exists at all) contains only generic helpers
  (e.g. a `createPersistedStore` wrapper around Zustand's `persist`
  middleware) — never an actual store instance, since a store instance is
  inherently app/feature-specific data.

## TanStack Query conventions

```ts
// apps/petcare/features/pets/hooks/usePets.ts
export function usePets() {
  const repo = usePetRepository();
  return useQuery({
    queryKey: ['petcare', 'pets'],
    queryFn: () => repo.listActive(),
  });
}

export function useCreatePet() {
  const repo = usePetRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePetInput) => repo.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['petcare', 'pets'] }),
  });
}
```

- **Query keys are namespaced** `[appId, ...domainPath]` (e.g.
  `['petcare', 'pets']`, `['petcare', 'feeds', petId]`) so the sync
  engine (see [SYNC_ENGINE.md](SYNC_ENGINE.md)) can invalidate precisely
  by table/entity without guessing screen-specific key shapes. Each
  feature's repository module exports its query key builders so the sync
  engine and other hooks don't hand-construct key arrays inconsistently.
- Because the "network" here is actually local SQLite (fast,
  synchronous-feeling), `staleTime` defaults are set higher than a typical
  web app talking to a real API — there's little value in background
  refetching a local read; the sync engine's explicit invalidation is
  what signals "this data actually changed."
- Mutations always go through a repository (via a feature hook), never
  call SQLite directly inside `mutationFn`.

## Zustand conventions

```ts
// apps/petcare/features/pets/state/petsFilterStore.ts
interface PetsFilterState {
  speciesFilter: string | null;
  setSpeciesFilter: (species: string | null) => void;
}
export const usePetsFilterStore = create<PetsFilterState>((set) => ({
  speciesFilter: null,
  setSpeciesFilter: (speciesFilter) => set({ speciesFilter }),
}));
```

Plain stores, no middleware beyond `persist` (for the rare case of
wanting a UI preference to survive app restart without needing a full
database round-trip — e.g. "last selected tab") and `devtools` in
development. No global "app state" store — that would recreate the
single-store-for-everything problem this split was chosen to avoid.

## Why not Redux/Redux Toolkit

Redux's value is a single, normalized, inspectable store for complex
shared client state — but here, the data that would go in that store
(pets, logs, subscriptions) already has a normalized source of truth:
SQLite, fronted by TanStack Query's cache. Adding Redux on top would mean
maintaining a second cache of the same data, kept in sync with the first
by hand. For the genuinely ephemeral UI state that's left over, Redux's
action/reducer/dispatch ceremony is more boilerplate than the problem
warrants — Zustand solves it with a fraction of the code.

## Why not Context for data fetching

Context re-renders every consumer on every value change and has no
built-in notion of "stale," "loading," "background refetch," or
"invalidate this specific query" — all things the sync engine needs to
signal to the UI. Context is used in this architecture only for values
that are small and change rarely (auth session, active theme) — the
right-sized tool for that narrower job, not for the pets list.

## Validation's role in state

Every mutation hook validates its input against the entity's Zod schema
before calling the repository (belt-and-suspenders with the repository's
own validation — see [DATABASE.md](DATABASE.md)) so that a form's
`onSubmit` and a repository's `create()` share exactly one definition of
"valid," never two schemas that can drift apart. See
[TECH_STACK.md](TECH_STACK.md) for the Zod + React Hook Form pairing on
the form side.
