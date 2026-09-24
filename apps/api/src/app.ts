import * as Sentry from "@sentry/core";
import { logger } from "./lib/logger";
// App de Hono sin dependencias de runtime: la usan el server de Bun (server.ts, dev y tests)
// y el Worker de Cloudflare (apps/web/src/worker.ts), que la monta en /dashboard/api.
import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRouter } from "./routes/auth";
import { subjectsRouter } from "./routes/subjects";
import { tasksRouter } from "./routes/tasks";
import { practiceJournalsRouter } from "./routes/practice_journals";
import { absencesRouter } from "./routes/absences";
import { icalRouter } from "./routes/ical";
import { sentryTunnelRouter } from "./routes/sentry_tunnel";
import { adminRouter } from "./routes/admin";
import { auth } from "./lib/auth.better";
import { z } from "zod";

export const app = new Hono();

// ✅ Error handler centralizado — respuestas JSON consistentes
app.onError(async (err, c) => {
  if (err instanceof z.ZodError) {
    logger.error("[Zod Error]", err.issues);
    // ERR-3: return field-level errors without exposing full schema
    const fieldErrors = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    return c.json({ error: "Validation error", details: fieldErrors }, 400);
  }
  logger.error("[API Error]", err.stack || err);

  // ERR-2: wrap getSession in try/catch to prevent cascading errors
  let sessionData: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
  try {
    sessionData = await auth.api.getSession({ headers: c.req.raw.headers });
  } catch {
    // Session lookup failed — continue without user context
  }

  Sentry.withScope(() => {
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

  // SEC-3: don't leak internal error messages to the client
  return c.json({ error: "Internal server error" }, 500);
});

// ✅ 404 handler — JSON en vez de HTML
app.notFound((c) => c.json({ error: "Not found" }, 404));

// ✅ CORS dinámico — soporta múltiples orígenes desde variable de entorno
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:4321").split(",");

app.use(
  "/api/*",
  cors({
    // SEC-5: reject unknown origins instead of falling back to the first allowed origin
    origin: (origin) => (ALLOWED_ORIGINS.includes(origin) ? origin : null),
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length", "Set-Cookie"],
    maxAge: 600,
    credentials: true,
  }),
);

// Better Auth handler — captura todas las rutas de /api/auth/* EXCEPTO /register
// que es una ruta custom con validación de invite code.
app.on(["GET", "POST", "OPTIONS"], "/api/auth/*", async (c, next) => {
  // Delegar /api/auth/register al authRouter custom
  if (c.req.path === "/api/auth/register") {
    return next();
  }

  // El registro solo se permite con invite (POST /api/auth/register).
  // Bloqueamos el sign-up público de Better Auth para que no se pueda saltear.
  if (c.req.path.startsWith("/api/auth/sign-up")) {
    return c.json({ error: "El registro requiere un código de invitación" }, 403);
  }

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

// Custom auth routes (register con invite code) — DESPUÉS del handler de Better Auth
app.route("/api/auth", authRouter);

app.route("/api/subjects", subjectsRouter);
app.route("/api/tasks", tasksRouter);
app.route("/api/practice-journals", practiceJournalsRouter);
app.route("/api/absences", absencesRouter);
app.route("/api/ical", icalRouter);
app.route("/api/sentry-tunnel", sentryTunnelRouter);
app.route("/api/admin", adminRouter);

app.get("/api/health", (c) => c.json({ status: "ok" }));
