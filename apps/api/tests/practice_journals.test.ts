import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/server";
import { auth } from "../src/lib/auth.better";
import type { PracticeJournal, Subject } from "@dashboard/shared-types";

async function getTestCookie(): Promise<string> {
  const email = `journals-${Date.now()}@test.com`;
  await auth.api.signUpEmail({ body: { email, password: "test12345", name: "Test" } });
  const res = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password: "test12345" }),
    headers: { "Content-Type": "application/json" },
  });
  return res.headers.get("set-cookie") || "";
}

describe("Practice Journals API Tests", () => {
  let subjectId: string;
  let cookie: string;

  beforeEach(async () => {
    cookie = await getTestCookie();

    const subRes = await app.request("/api/subjects", {
      method: "POST",
      body: JSON.stringify({ name: "Subject for Journals", total_classes: 5 }),
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
    });
    const sub = (await subRes.json()) as Subject;
    subjectId = sub.id;
  });

  it("POST /api/practice-journals should create a new journal entry", async () => {
    const res = await app.request("/api/practice-journals", {
      method: "POST",
      body: JSON.stringify({
        subject_id: subjectId,
        date: new Date().toISOString(),
        content: "Hoy practicamos escalas de Do mayor en el piano.",
      }),
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as PracticeJournal;
    expect(body.content).toContain("escalas de Do mayor");
    expect(body.subject_id).toBe(subjectId);
  });

  it("GET /api/practice-journals should return all journals of user", async () => {
    await app.request("/api/practice-journals", {
      method: "POST",
      body: JSON.stringify({
        subject_id: subjectId,
        date: new Date().toISOString(),
        content: "Entrada auxiliar para test de listado.",
      }),
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
    });

    const res = await app.request("/api/practice-journals", {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as PracticeJournal[];
    expect(body.length).toBeGreaterThan(0);
  });

  it("GET /api/practice-journals?subject_id=... should filter journals", async () => {
    await app.request("/api/practice-journals", {
      method: "POST",
      body: JSON.stringify({
        subject_id: subjectId,
        date: new Date().toISOString(),
        content: "Entrada para test de filtrado.",
      }),
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
    });

    const res = await app.request(`/api/practice-journals?subject_id=${subjectId}`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as PracticeJournal[];
    expect(body.every((j) => j.subject_id === subjectId)).toBe(true);
  });
});
