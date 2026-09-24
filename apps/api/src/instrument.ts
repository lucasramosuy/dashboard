import * as Sentry from "@sentry/bun";

// Sentry del server de Bun (solo desarrollo local). En producción lo inicializa el Worker.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  sendDefaultPii: true,
  tracesSampleRate: 1.0,
});
