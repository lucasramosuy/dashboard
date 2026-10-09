import { Hono } from "hono";
import { db } from "../lib/db";
import { authMiddleware, type AuthEnv } from "../middleware/auth-middleware";
import type { WeeklySummary } from "../services/weeklySummary";
const weeklySummaryRouter = new Hono<AuthEnv>();
weeklySummaryRouter.use("/*", authMiddleware);
weeklySummaryRouter.get("/", async (c) => {
  const result = await db.execute({
    sql: "SELECT payload FROM weekly_summary WHERE user_id = ? ORDER BY week_start DESC LIMIT 1",
    args: [c.get("user").id],
  });
  return c.json({ summary: result.rows[0] ? JSON.parse(String(result.rows[0].payload)) as WeeklySummary : null });
});
export { weeklySummaryRouter };
