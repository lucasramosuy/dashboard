import { describe, it, expect, beforeEach } from "bun:test"; // ← beforeAll eliminado
import { app } from "../src/server";
import type { Subject } from "@dashboard/shared-types";

describe("Subjects API Tests", () => {
  let subjectId: string;
  let token: string;

  beforeEach(async () => {
    // ← era beforeAll
    const res = await app.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "demo@example.com", password: "demo123" }),
      headers: { "Content-Type": "application/json" },
    });
    const body = (await res.json()) as any;
    token = body.token;
  });

  it("POST /api/subjects should create a new subject", async () => {
    const res = await app.request("/api/subjects", {
      method: "POST",
      body: JSON.stringify({ name: "Matemáticas I", total_classes: 32 }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
    // Crear materia primero para que la lista no esté vacía
    const createRes = await app.request("/api/subjects", {
      method: "POST",
      body: JSON.stringify({ name: "Matemáticas I", total_classes: 32 }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    subjectId = ((await createRes.json()) as Subject).id;

    const res = await app.request("/api/subjects", {
      headers: { Authorization: `Bearer ${token}` },
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
        Authorization: `Bearer ${token}`,
      },
    });
    subjectId = ((await createRes.json()) as Subject).id;

    const res = await app.request(`/api/subjects/${subjectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Subject;
    expect(body.id).toBe(subjectId);
    expect(body.name).toBe("Matemáticas I");
  });

  it("GET /api/subjects/at-risk should return at-risk subjects", async () => {
    const res = await app.request("/api/subjects/at-risk", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any[];
    expect(Array.isArray(body)).toBe(true);
  });

  it("DELETE /api/subjects/:id should remove a subject", async () => {
    const createRes = await app.request("/api/subjects", {
      method: "POST",
      body: JSON.stringify({ name: "Materia a borrar", total_classes: 10 }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    subjectId = ((await createRes.json()) as Subject).id;

    const res = await app.request(`/api/subjects/${subjectId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);

    const checkRes = await app.request(`/api/subjects/${subjectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(checkRes.status).toBe(404);
  });
});
