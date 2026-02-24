import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRouter } from './routes/auth';
import { subjectsRouter } from './routes/subjects';
import { tasksRouter } from './routes/tasks';
import { practiceJournalsRouter } from './routes/practice_journals';
import { absencesRouter } from './routes/absences';
import { initDB } from './lib/db';

// --- CONFIGURATION GUARD ---
const JWT_SECRET = Bun.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "dev-secret-change-me") {
  console.warn("\n\x1b[33m%s\x1b[0m", "⚠️  WARNING: Using default or missing JWT_SECRET.");
  console.warn("\x1b[33m%s\x1b[0m", "   Environment is insecure for production use.\n");
}

// Initialize SQLite tables
initDB();

export const app = new Hono();

// CORS middleware
app.use('/api/*', cors({
  origin: 'http://localhost:4321',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// Mount Auth routes
app.route('/api/auth', authRouter);
// Mount Business routes
app.route('/api/subjects', subjectsRouter);
app.route('/api/tasks', tasksRouter);
app.route('/api/practice-journals', practiceJournalsRouter);
app.route('/api/absences', absencesRouter);

app.get('/api/health', (c) => {
  return c.json({ status: "ok" });
});

console.log("\x1b[32m%s\x1b[0m", "🚀 API Server running on port 8787");

export default {
  port: 8787,
  fetch: app.fetch,
};
