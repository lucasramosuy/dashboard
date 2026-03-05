import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/server";
import { auth } from "../src/lib/auth.better";
import type { Subject } from "@dashboard/shared-types";

// Helper: crea usuario de test y obtiene session cookie
async function getTestCookie(): Promise<string> {
  const email = `subjects-${Date.now()}@test.com`;
  await auth.api.signUpEmail({ body: { email, password: "test12345", name: "Test" } });
  const res = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password: "test12345" }),
    headers: { "Content-Type": "application/json" },
  });
  return res.headers.get("set-cookie") || "";
}

describe("Subjects API Tests", () => {
  let subjectId: string;
  let cookie: string;

  beforeEach(async () => {
    cookie = await getTestCookie();
  });

  it("POST /api/subjects should create a new subject", async () => {
    const res = await app.request("/api/subjects", {
      method: "POST",
      body: JSON.stringify({ name: "Matemáticas I", total_classes: 32 }),
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as Subject;
    expect(body.name).toBe("Matemáticas I");
    expect(body.total_classes).toBe(32);
    expect(body).toHaveProperty("id");
    subjectId = body.id;
  });

  it("GET /api/subjects should return a list of subjects", async () => {
    const createRes = await app.request("/api/subjects", {
      method: "POST",
      body: JSON.stringify({ name: "Matemáticas I", total_classes: 32 }),
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
    });
    subjectId = ((await createRes.json()) as Subject).id;

    const res = await app.request("/api/subjects", {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Subject[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((s) => s.id === subjectId)).toBe(true);
  });

  it("GET /api/subjects/:id should return a specific subject", async () => {
    const createRes = await app.request("/api/subjects", {
      method: "POST",
      body: JSON.stringify({ name: "Matemáticas I", total_classes: 32 }),
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
    });
    subjectId = ((await createRes.json()) as Subject).id;

    const res = await app.request(`/api/subjects/${subjectId}`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Subject;
    expect(body.id).toBe(subjectId);
    expect(body.name).toBe("Matemáticas I");
  });

  it("GET /api/subjects/at-risk should return at-risk subjects", async () => {
    const res = await app.request("/api/subjects/at-risk", {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any[];
    expect(Array.isArray(body)).toBe(true);
  });

  it("DELETE /api/subjects/:id should remove a subject", async () => {
    const createRes = await app.request("/api/subjects", {
      method: "POST",
      body: JSON.stringify({ name: "UC a borrar", total_classes: 10 }),
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
    });
    subjectId = ((await createRes.json()) as Subject).id;

    const res = await app.request(`/api/subjects/${subjectId}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);

    const checkRes = await app.request(`/api/subjects/${subjectId}`, {
      headers: { Cookie: cookie },
    });
    expect(checkRes.status).toBe(404);
  });
});
