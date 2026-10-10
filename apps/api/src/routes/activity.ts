import { Hono } from "hono";
import { db } from "../lib/db";
import { authMiddleware, type AuthEnv } from "../middleware/auth-middleware";

const activityRouter = new Hono<AuthEnv>();
activityRouter.use("/*", authMiddleware);

// Día y semana calendario de Montevideo, no ventanas móviles de 24/168 horas.
export function activityWindow(period: "today" | "week", now = new Date()) {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Montevideo" }).format(now);
  const start = new Date(`${day}T00:00:00-03:00`);
  if (period === "week") {
    const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
    start.setUTCDate(start.getUTCDate() - ((weekday + 6) % 7));
  }
  const end = new Date(`${day}T00:00:00-03:00`);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

activityRouter.get("/", async (c) => {
  const period = c.req.query("period") ?? "week";
  const rawLimit = c.req.query("limit") ?? "50";
  if ((period !== "today" && period !== "week") || !/^\d+$/.test(rawLimit)) {
    return c.json({ error: "Invalid period or limit" }, 400);
  }
  const limit = Number(rawLimit);
  if (limit < 1 || limit > 100) return c.json({ error: "Limit must be 1-100" }, 400);
  const window = activityWindow(period);
  const result = await db.execute({
    sql: `SELECT id, entity, entity_id, action, label, created_at FROM activity_log
          WHERE user_id = ? AND created_at >= ? AND created_at < ?
          ORDER BY created_at DESC, id DESC LIMIT ?`,
    args: [c.get("user").id, window.start, window.end, limit + 1],
  });
  const items = result.rows.slice(0, limit).map((row) => ({
    id: row.id, entity: row.entity, entity_id: row.entity_id,
    action: row.action, label: row.label, created_at: row.created_at,
  }));
  return c.json({ items, period, ...window, has_more: result.rows.length > limit });
});

export { activityRouter };
