// Entrada del Worker de Cloudflare: la web (Astro) y la API (Hono) en el mismo origen,
// más los Cron Triggers (sync del iCal y resumen de Telegram). Configurado como "main" en wrangler.jsonc.
import type { ExecutionContext, ExportedHandler } from "@cloudflare/workers-types";
import * as Sentry from "@sentry/cloudflare";
import { handle } from "@astrojs/cloudflare/handler";
import { handleApi, isApiPath } from "./server/api";
import { runDailySummary, SUMMARY_CRON_UTC, syncAllCalendars } from "../../api/src/cron";

type Env = { SENTRY_DSN?: string; [key: string]: unknown };

const handler = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    if (isApiPath(new URL(request.url).pathname)) return handleApi(request, env, ctx);
    return handle(request as never, env as never, ctx) as never;
  },
  async scheduled(controller: { cron: string }, _env: Env, ctx: ExecutionContext) {
    if (controller.cron === SUMMARY_CRON_UTC) ctx.waitUntil(runDailySummary());
    else ctx.waitUntil(syncAllCalendars());
  },
};

// Los tipos de Request/Response de workers-types y los del DOM difieren solo en `cf`;
// en runtime son los mismos objetos.
const typedHandler = handler as unknown as ExportedHandler<Env>;

export default Sentry.withSentry(
  (env: Env) => ({
    dsn:
      env.SENTRY_DSN ||
      "https://f8ee541e1cbbf5ab6d935de9bfd9e6b9@o4510988275482624.ingest.us.sentry.io/4510988282822656",
    sendDefaultPii: true,
    tracesSampleRate: 0.2,
  }),
  typedHandler,
);
