import * as Sentry from "@sentry/bun";

// 1. Global Bun Runtime (Errors outside Hono, Crons, etc.)
// We initialize this as early as possible (via instrument.ts)
Sentry.init({
  dsn: Bun.env.SENTRY_BUN_DSN,
  sendDefaultPii: true,
  enableLogs: false, // Set to true only for debugging
  tracesSampleRate: 1.0,
});
