import { Hono } from 'hono';
import { authRouter } from './routes/auth';
import { subjectsRouter } from './routes/subjects';
import { tasksRouter } from './routes/tasks';
import { practiceJournalsRouter } from './routes/practice_journals';

export const app = new Hono();

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
