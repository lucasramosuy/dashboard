import * as Sentry from "@sentry/astro";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
Sentry.init({
  dsn:
    import.meta.env.PUBLIC_SENTRY_DSN ||
    "https://f8ee541e1cbbf5ab6d935de9bfd9e6b9@o4510988275482624.ingest.us.sentry.io/4510988282822656",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/astro/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  integrations: [
    // Add our Profiling integration
    nodeProfilingIntegration(),
  ],
  // En producción usar 0.2 (20%); subir temporalmente para depurar.
  tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
  // En producción: 20% de sesiones con profiling activo.
  profileSessionSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
  // Enable logs to be sent to Sentry
  enableLogs: true,
});
