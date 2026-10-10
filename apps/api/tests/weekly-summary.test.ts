import { describe, it, expect } from "bun:test";
import { app } from "../src/server";
import { auth } from "../src/lib/auth.better";
import { db, dbService } from "../src/lib/db";
import { buildWeeklySummary, saveWeeklySummary, runWeeklySummary, WEEKLY_CRON_UTC } from "../src/services/weeklySummary";
import { randomUUID } from "node:crypto";
async function owner() {
  const email = `${randomUUID()}@weekly.test`;
  const created = await auth.api.signUpEmail({ body: { email, password: "test12345", name: "Test" } });
  const res = await app.request("/api/auth/sign-in/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "test12345" }) });
  return { id: created.user.id, cookie: res.headers.get("set-cookie") || "" };
}
describe("Weekly summary in panel", () => {
  it("uses shared health and keeps grade0 and private-owner isolation", async () => {
    const u = await owner(); const other = await owner(); const id = randomUUID();
    await dbService.subjects.create({ id, user_id: u.id, name: "Didáctica", total_classes: 20 });
    await dbService.tasks.create({ id: randomUUID(), user_id: u.id, subject_id: id, title: "Nota0", status: "done", grade: 0, due_date: new Date("2026-10-10T00:00:00Z") });
    const now = new Date();
    const summary = await buildWeeklySummary(u.id, now);
    expect(summary.subjects).toHaveLength(1); expect(summary.subjects[0].average).toBe(0);
    expect(summary.subjects[0].level).toBe("attention"); expect(summary.activity_count).toBe(2);
    expect((await buildWeeklySummary(other.id, now)).subjects).toHaveLength(0);
  });
  it("API requires auth and does not generate a snapshot on read", async () => {
    expect((await app.request("/api/weekly-summary")).status).toBe(401);
    const u = await owner();
    const r = await app.request("/api/weekly-summary", { headers: { Cookie: u.cookie } });
    expect(r.status).toBe(200); expect(await r.json()).toEqual({ summary: null });
  });
  it("saves once per week and returns only authenticated-owner snapshot", async () => {
    const u = await owner(); const other = await owner();
    const now = new Date("2026-10-11T23:00:00Z");
    await saveWeeklySummary(u.id, now); await saveWeeklySummary(u.id, now);
    const count = await db.execute({ sql: "SELECT count(*) n FROM weekly_summary WHERE user_id=?", args: [u.id] });
    expect(Number(count.rows[0].n)).toBe(1);
    const r = await app.request("/api/weekly-summary", { headers: { Cookie: u.cookie } });
    const body = await r.json() as { summary: { week_start: string } };
    expect(body.summary.week_start).toBe("2026-10-05");
    const empty = await app.request("/api/weekly-summary", { headers: { Cookie: other.cookie } });
    expect(await empty.json()).toEqual({ summary: null });
  });
  it("cron creates snapshots for each account without Telegram and keeps12 weeks", async () => {
    const u = await owner(); const other = await owner();
    expect(WEEKLY_CRON_UTC).toBe("0 23 * * 0");
    await runWeeklySummary(new Date("2026-10-11T23:00:00Z"));
    const initial = await db.execute("SELECT user_id FROM weekly_summary");
    expect(initial.rows.map((r) => r.user_id).sort()).toEqual([u.id, other.id].sort());
    for (let i = 1; i <= 13; i++) await saveWeeklySummary(u.id, new Date(Date.UTC(2026, 9, 11 + 7 * i, 23)));
    const rs = await db.execute({ sql: "SELECT count(*) n FROM weekly_summary WHERE user_id=?", args: [u.id] });
    expect(Number(rs.rows[0].n)).toBe(12);
  });
});
