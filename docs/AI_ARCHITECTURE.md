# AI Architecture

AI is a secondary feature in every app (see [ARCHITECTURE.md](ARCHITECTURE.md)):
summarizing, finding patterns, answering questions about the user's own
data, suggesting improvements. It never becomes the primary interaction
model, and every app must be fully usable with AI unreachable.

## Design goals, in priority order

1. **Low cost per user** — the user's explicit top priority. Every design
   choice below is filtered through "does this keep the per-request cost
   small and predictable."
2. **No vendor lock-in** — the LLM provider must be swappable without
   touching feature code, even though a specific cheap provider is chosen
   initially.
3. **No API keys on-device** — all LLM calls are server-side.
4. **Data minimization** — send the LLM only what's needed to answer the
   question, not raw dumps of the user's database.

## Request flow

```
Feature hook (e.g. useInsights() in features/pets/hooks/)
   → builds a summarized context object locally (from repository reads)
   → calls packages/ai's client: aiClient.ask({ prompt, context })
       → POST to Supabase Edge Function "ai-proxy"
           → ai-proxy selects a provider adapter (config-driven)
               → calls the actual LLM API with the server-held key
           → returns the response
       → aiClient returns a typed result to the hook
   → hook returns data to the screen (loading/success/error via TanStack Query)
```

The client (`packages/ai`) never talks to an LLM API directly and never
holds an API key — see [SECURITY.md](SECURITY.md). The only network call
from the client is to our own `ai-proxy` Edge Function.

## Data access pattern: structured query + summarization, not RAG

For a v1 feature like "has Max been eating less lately?":

1. The feature hook queries the local repository for the relevant slice
   of data (e.g. `FeedRepository.listForPet(petId, { since: 30daysAgo })`).
2. The hook (or a small per-feature "summarizer" function in
   `features/<feature>/ai/`) reduces that into a compact, structured
   summary — not the raw rows. E.g.: `{ petName, last30DaysFeedCount,
avgPortionSize, trendVsPrevious30Days }` rather than 90 raw log rows.
3. That summary, plus the user's question and a feature-specific prompt
   template, is sent to `ai-proxy`.

**Why not RAG (embeddings + vector search):** RAG earns its complexity
when the corpus is large enough that "which records are even relevant"
is itself a hard problem — a big shared knowledge base, long documents,
cross-user corpora. Here, the corpus is one user's data in one feature
(dozens to low-thousands of small rows), which a plain SQL query already
answers precisely and cheaply. RAG would add an embedding pipeline, a
vector store, and ongoing embedding-generation cost, for a problem
regular queries already solve — pure overhead at this data scale. This
is a deliberate v1 decision, revisit only if a specific future app has a
genuinely large, unstructured corpus (e.g. long-form D&D campaign notes)
where semantic search over free text becomes the actual need — see
[ROADMAP.md](ROADMAP.md).

**Why summarize instead of sending raw rows:** cost (fewer input tokens)
and quality (a well-structured summary is easier for a small/cheap model
to reason over correctly than raw tabular data) both point the same
direction.

## Provider abstraction

`packages/ai` defines a provider-agnostic interface, implemented only
inside the Edge Function (never shipped to the client):

```ts
// packages/ai/src/types.ts — the internal SDK's public contract
interface AiProvider {
  complete(request: {
    systemPrompt: string;
    userPrompt: string;
    context: Record<string, unknown>; // the summarized context
    maxOutputTokens?: number;
  }): Promise<{
    text: string;
    usage: { inputTokens: number; outputTokens: number };
  }>;
}
```

Concrete adapters (`AnthropicProvider`, `OpenAiProvider`, ...) implement
this interface inside `supabase/functions/ai-proxy/providers/`. Which
adapter is active is a **runtime config value** (an environment variable
read by the Edge Function), not a code branch scattered through feature
code — swapping providers, or A/B testing two providers for cost/quality,
never requires a client release. This is the concrete mechanism behind
the "no vendor lock-in" decision from [ARCHITECTURE.md](ARCHITECTURE.md):
the interface is the contract; the adapter is an implementation detail
the rest of the system doesn't know about.

Provider choice for launch (Anthropic vs. OpenAI vs. other) should be
made based on then-current pricing for the smallest/cheapest capable
model tier from each — re-evaluate at implementation time rather than
locking in a specific model ID in this document, since pricing and model
lineups change faster than this architecture should.

## Prompt templates live with the feature, not the platform

`packages/ai` provides the _mechanism_ (client, provider interface,
request/response types). It contains zero prompt text and zero knowledge
of "pets" or "feedings" — consistent with the "packages never contain
domain logic" rule in [REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md).
Actual prompts — "You are a helpful assistant for a pet care app. Given
this feeding history summary, answer the user's question concisely..." —
live in `apps/<app>/features/<feature>/ai/prompts.ts`, next to the
summarizer that builds the context those prompts reference.

## Caching and cost control

- Identical `(feature, entity, question-shape)` requests within a short
  window (e.g. re-opening the same insights screen) are cached client-side
  via TanStack Query's normal caching — no special AI-specific cache
  needed.
- `ai-proxy` enforces a per-user rate limit (checked against
  `public.subscriptions`/a lightweight request-count table) so a free-tier
  user can't drive unbounded cost; exact limits are a product decision to
  set during Pet Care implementation, not fixed here.
- `maxOutputTokens` is always set explicitly per prompt template — no
  open-ended generations.

## Failure handling

An AI feature failing (provider down, rate-limited, malformed response)
must never block or degrade the app's core functionality — it fails into
an empty/retryable state on just that insights screen, handled through
the same `packages/logger` + typed-error pattern as everything else. See
[ERROR_HANDLING.md](ERROR_HANDLING.md).

## Testing

Provider adapters are tested against recorded fixture responses (not live
API calls) in CI, per the pragmatic testing philosophy in
[TESTING.md](TESTING.md) — the goal is verifying our request/response
handling and error paths, not re-testing the LLM provider itself.
