import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRouter } from './routes/auth';
import { subjectsRouter } from './routes/subjects';
import { tasksRouter } from './routes/tasks';
import { practiceJournalsRouter } from './routes/practice_journals';
import { initDB } from './lib/db';

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

app.get('/api/health', (c) => {
  return c.json({ status: "ok" });
});

export default {
  port: 8787,
  fetch: app.fetch,
};
