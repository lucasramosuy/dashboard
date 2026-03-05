import * as Sentry from "@sentry/astro";
Sentry.init({
  dsn:
    import.meta.env.PUBLIC_SENTRY_ASTRO_TOKEN ||
    "https://f8ee541e1cbbf5ab6d935de9bfd9e6b9@o4510988275482624.ingest.us.sentry.io/4510988282822656",

  // Tunnel para evitar bloqueos por ad-blockers
  tunnel: "/api/sentry-tunnel/tunnel",

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
  // Define how likely traces are sampled. Adjust this value in production,
  // or use tracesSampler for greater control.
  tracesSampleRate: 1.0,
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 1,
  // If the entire session is not sampled, use the below sample rate to sample
  // sessions when an error occurs.
  replaysOnErrorSampleRate: 1.0,
  // Enable logs to be sent to Sentry
  enableLogs: true,
});
