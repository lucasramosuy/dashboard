import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRouter } from "./routes/auth";
import { subjectsRouter } from "./routes/subjects";
import { tasksRouter } from "./routes/tasks";
import { practiceJournalsRouter } from "./routes/practice_journals";
import { absencesRouter } from "./routes/absences";
import { icalRouter } from "./routes/ical";
import { initDB } from "./lib/db";
import { z } from "zod/v4";
import { initCronJobs } from "./cron";

// Initialize SQLite tables
await initDB();

// Initialize Cron Jobs (e.g. daily ical sync)
initCronJobs();

export const app = new Hono();

// ✅ Error handler centralizado — respuestas JSON consistentes
app.onError((err, c) => {
  if (err instanceof z.ZodError) {
    console.error("[Zod Error]", err.issues);
    return c.json({ error: "Validation error", details: err.format() }, 400);
  }
  console.error("[API Error]", err.stack || err);
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

import { auth } from "./lib/auth.better";

app.route("/api/auth", authRouter);
app.on(["GET", "POST"], "/api/auth/*", async (c) => {
  return auth.handler(c.req.raw);
});

app.route("/api/subjects", subjectsRouter);
app.route("/api/tasks", tasksRouter);
app.route("/api/practice-journals", practiceJournalsRouter);
app.route("/api/absences", absencesRouter);
app.route("/api/ical", icalRouter);

app.get("/api/health", (c) => c.json({ status: "ok" }));

const port = process.env.PORT || 8787;

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

// ✅ Graceful shutdown para evitar puertos ocupados (EADDRINUSE) en Windows
const shutdown = (signal: string) => {
  console.log(`\n[${signal}] Cerrando servidor Bun y liberando el puerto ${server.port}...`);
  server.stop(true); // Detiene conexiones activas y libera el puerto
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
