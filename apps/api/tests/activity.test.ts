import { describe, it, expect } from "bun:test";
import { app } from "../src/server";
import { auth } from "../src/lib/auth.better";
import { db, dbService, initDB } from "../src/lib/db";
import { activityWindow } from "../src/routes/activity";
import { randomUUID } from "node:crypto";

type Feed = { items: { action: string; entity: string; entity_id: string; label: string }[]; has_more: boolean };

async function owner() {
  const email = `${randomUUID()}@activity.test`;
  const created = await auth.api.signUpEmail({ body: { email, password: "test12345", name: "Test" } });
  const res = await app.request("/api/auth/sign-in/email", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "test12345" }),
  });
  return { id: created.user.id, cookie: res.headers.get("set-cookie") || "" };
}
async function task(userId: string) {
  const t = { id: randomUUID(), user_id: userId, title: "Ensayo", due_date: new Date(), status: "todo" as const };
  await dbService.tasks.create(t);
  return t;
}
async function feed(cookie: string, query = "") {
  return app.request(`/api/activity${query}`, { headers: { Cookie: cookie } });
}

describe("Activity DB/API", () => {
  it("requires auth and validates period/limit", async () => {
    expect((await app.request("/api/activity")).status).toBe(401);
    const u = await owner();
    for (const query of ["?period=all", "?limit=0", "?limit=101", "?limit=1x"]) {
      expect((await feed(u.cookie, query)).status).toBe(400);
    }
  });
  it("records task writes, not unchanged edits, and survives deletion", async () => {
    const u = await owner(); const t = await task(u.id);
    await dbService.tasks.updateStatus(t.id, "todo");
    await dbService.tasks.update(t.id, { grade: 0, comments: "private comment" });
    await dbService.tasks.delete(t.id);
    const body = await (await feed(u.cookie)).json() as Feed;
    expect(body.items).toHaveLength(3);
    expect(body.items.map((i: { action: string }) => i.action).sort()).toEqual(["created", "deleted", "updated"]);
    expect(body.items.every((i: { label: string }) => i.label === "Ensayo")).toBe(true);
    expect(JSON.stringify(body)).not.toContain("private comment");
  });
  it("isolates owners and bounds response", async () => {
    const a = await owner(); const b = await owner();
    await task(a.id); await task(a.id); const other = await task(b.id);
    const body = await (await feed(a.cookie, "?limit=1")).json() as Feed;
    expect(body.items).toHaveLength(1); expect(body.has_more).toBe(true);
    expect(body.items[0].entity_id).not.toBe(other.id);
    expect((await (await feed(b.cookie)).json() as Feed).items).toHaveLength(1);
  });
  it("records subjects/absences/journals without journal bodies", async () => {
    const u = await owner(); const subjectId = randomUUID(); const journalId = randomUUID();
    await dbService.subjects.create({ id: subjectId, user_id: u.id, name: "UC", total_classes: 20 });
    await dbService.absences.create({ id: randomUUID(), subject_id: subjectId, date: new Date(), type: "standard", calculated_value: 1 });
    await dbService.journals.create({ id: journalId, user_id: u.id, subject_id: "Derecho", date: new Date(), content: "private journal body" });
    await dbService.journals.update(journalId, "another private body");
    const body = await (await feed(u.cookie)).json() as Feed;
    expect(body.items).toHaveLength(4);
    expect(body.items.map((i: { entity: string }) => i.entity).sort()).toEqual(["absence", "journal", "journal", "subject"]);
    expect(JSON.stringify(body)).not.toContain("private");
  });
  it("rolls back mutation if activity insert fails; migration is idempotent", async () => {
    const u = await owner(); await initDB(); await initDB();
    await db.execute(`CREATE TRIGGER activity_test_fail BEFORE INSERT ON activity_log BEGIN SELECT RAISE(ABORT, 'test'); END`);
    const id = randomUUID();
    try {
      await expect(dbService.tasks.create({ id, user_id: u.id, title: "rollback", due_date: new Date(), status: "todo" })).rejects.toThrow();
      expect(await dbService.tasks.getById(id)).toBeNull();
    } finally { await db.execute("DROP TRIGGER activity_test_fail"); }
  });
  it("computes Monday/week and midnight Montevideo bounds", () => {
    expect(activityWindow("today", new Date("2026-10-10T02:00:00Z"))).toEqual({ start: "2026-10-09T03:00:00.000Z", end: "2026-10-10T03:00:00.000Z" });
    expect(activityWindow("week", new Date("2026-10-11T23:00:00Z"))).toEqual({ start: "2026-10-05T03:00:00.000Z", end: "2026-10-12T03:00:00.000Z" });
  });
});
