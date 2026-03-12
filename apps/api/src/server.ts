import "./instrument";
import * as Sentry from "@sentry/bun";
import { logger } from "./lib/logger";

// 2. Hono API Specific Client
// We create a dedicated client to send Hono-specific errors to a separate project
const honoClient = new Sentry.NodeClient({
  dsn: Bun.env.SENTRY_HONO_DSN,
  // En producción: 20% de traces; en dev: 100%.
  tracesSampleRate: Bun.env.NODE_ENV === "production" ? 0.2 : 1.0,
  sendDefaultPii: true,
  integrations: [],
  transport: Sentry.makeFetchTransport,
  stackParser: Sentry.defaultStackParser,
});
honoClient.init();

import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRouter } from "./routes/auth";
import { subjectsRouter } from "./routes/subjects";
import { tasksRouter } from "./routes/tasks";
import { practiceJournalsRouter } from "./routes/practice_journals";
import { absencesRouter } from "./routes/absences";
import { icalRouter } from "./routes/ical";
import { sentryTunnelRouter } from "./routes/sentry_tunnel";
import { initDB } from "./lib/db";
import { auth } from "./lib/auth.better";
import { z } from "zod/v4";
import { initCronJobs } from "./cron";

// Initialize SQLite tables
await initDB();

// Initialize Cron Jobs (e.g. daily ical sync)
initCronJobs();

export const app = new Hono();

// ✅ Error handler centralizado — respuestas JSON consistentes
app.onError(async (err, c) => {
  if (err instanceof z.ZodError) {
    logger.error("[Zod Error]", err.issues);
    return c.json({ error: "Validation error", details: err.format() }, 400);
  }
  logger.error("[API Error]", err.stack || err);

  // Intentamos obtener el usuario actual para Sentry Logging
  const sessionData = await auth.api.getSession({ headers: c.req.raw.headers });

  // Aislamos el scope para que este error se mande específicamente con el cliente Hono
  Sentry.withIsolationScope(() => {
    Sentry.setCurrentClient(honoClient);

    Sentry.captureException(err, {
      captureContext: {
        user: sessionData?.user
          ? {
              id: sessionData.user.id,
              email: sessionData.user.email,
              username: sessionData.user.name,
            }
          : undefined,
        extra: {
          path: c.req.path,
          method: c.req.method,
        },
      },
    });
  });

  return c.json({ error: err.message || "Internal server error" }, 500);
});

// ✅ 404 handler — JSON en vez de HTML
app.notFound((c) => c.json({ error: "Not found" }, 404));

// ✅ CORS dinámico — soporta múltiples orígenes desde variable de entorno
const ALLOWED_ORIGINS = (Bun.env.CORS_ORIGINS || "http://localhost:4321").split(",");

app.use(
  "/api/*",
  cors({
    origin: (origin) => (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]),
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

app.route("/api/auth", authRouter);
app.on(["GET", "POST", "OPTIONS"], "/api/auth/*", async (c) => {
  const origin = c.req.header("Origin");
  const validOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : null;

  // Responder directamente a preflight OPTIONS sin pasar por Better Auth
  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...(validOrigin && { "Access-Control-Allow-Origin": validOrigin }),
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
      },
    });
  }

  const response = await auth.handler(c.req.raw);

  // Better Auth devuelve un Response crudo que no pasa por el middleware de Hono,
  // así que los headers de CORS no se aplican. Los copiamos manualmente.
  if (validOrigin) {
    response.headers.set("Access-Control-Allow-Origin", validOrigin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return response;
});

app.route("/api/subjects", subjectsRouter);
app.route("/api/tasks", tasksRouter);
app.route("/api/practice-journals", practiceJournalsRouter);
app.route("/api/absences", absencesRouter);
app.route("/api/ical", icalRouter);
app.route("/api/sentry-tunnel", sentryTunnelRouter);

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.get("/api/test-error", () => {
  throw new Error("Sentry Example API Error");
});

const port = Bun.env.PORT || 8787;

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

// ✅ Graceful shutdown para evitar puertos ocupados (EADDRINUSE) en Windows
const shutdown = (signal: string) => {
  logger.warn(`\n[${signal}] Cerrando servidor Bun y liberando el puerto ${server.port}...`);
  server.stop(true); // Detiene conexiones activas y libera el puerto
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
