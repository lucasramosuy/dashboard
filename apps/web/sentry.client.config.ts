import * as Sentry from "@sentry/astro";
Sentry.init({
  dsn:
    import.meta.env.PUBLIC_SENTRY_DSN ||
    "https://f8ee541e1cbbf5ab6d935de9bfd9e6b9@o4510988275482624.ingest.us.sentry.io/4510988282822656",

  // Tunnel para evitar bloqueos por ad-blockers
  tunnel: "/api/sentry-tunnel",

  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/astro/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: "system",
      autoInject: false,
    }),
  ],
  // En producción usar 0.2 (20%); subir temporalmente para depurar.
  tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
  // En producción: 10% de sesiones. En dev: 100% para ver replays completos.
  replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  // If the entire session is not sampled, use the below sample rate to sample
  // sessions when an error occurs.
  replaysOnErrorSampleRate: 1.0,
  // Enable logs to be sent to Sentry
  enableLogs: true,
});
