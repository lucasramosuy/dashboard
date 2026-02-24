import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRouter } from "./routes/auth";
import { subjectsRouter } from "./routes/subjects";
import { tasksRouter } from "./routes/tasks";
import { practiceJournalsRouter } from "./routes/practice_journals";
import { absencesRouter } from "./routes/absences";
import { initDB } from "./lib/db";

// --- CONFIGURATION GUARD ---
const JWT_SECRET = Bun.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "dev-secret-change-me") {
  console.warn(
    "\n\x1b[33m%s\x1b[0m",
    "⚠️  WARNING: Using default or missing JWT_SECRET.",
  );
  console.warn(
    "\x1b[33m%s\x1b[0m",
    "   Environment is insecure for production use.\n",
  );
}

// Initialize SQLite tables
await initDB();

export const app = new Hono();

// ✅ CORS dinámico — soporta múltiples orígenes desde variable de entorno
const ALLOWED_ORIGINS = (Bun.env.CORS_ORIGINS || "http://localhost:4321").split(
  ",",
);

app.use(
  "/api/*",
  cors({
    origin: (origin) =>
      ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

app.route("/api/auth", authRouter);
app.route("/api/subjects", subjectsRouter);
app.route("/api/tasks", tasksRouter);
app.route("/api/practice-journals", practiceJournalsRouter);
app.route("/api/absences", absencesRouter);

app.get("/api/health", (c) => c.json({ status: "ok" }));

console.log("\x1b[32m%s\x1b[0m", "🚀 API Server running on port 8787");

export default {
  port: 8787,
  fetch: app.fetch,
};
