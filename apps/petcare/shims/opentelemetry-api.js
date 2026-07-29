// Stub for @opentelemetry/api — drizzle-orm imports this optionally for tracing.
// It is not available in React Native / web bundles; this shim satisfies the import.
module.exports = {
  trace: {
    getTracer: () => ({ startActiveSpan: (_n, fn) => fn({ end: () => {} }) }),
  },
  context: { with: (_ctx, fn) => fn() },
  SpanStatusCode: { OK: 1, ERROR: 2 },
};
