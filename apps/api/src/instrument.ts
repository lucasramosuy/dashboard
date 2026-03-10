import * as Sentry from "@sentry/bun";

// 1. Global Bun Runtime (Errors outside Hono, Crons, etc.)
// We initialize this as early as possible (via instrument.ts)
Sentry.init({
  dsn: Bun.env.SENTRY_BUN_DSN,
  sendDefaultPii: true,
  enableLogs: false, // Set to true only for debugging
  // En producción: 20% de traces; en dev: 100% para depuración completa.
  tracesSampleRate: Bun.env.NODE_ENV === "production" ? 0.2 : 1.0,
});
