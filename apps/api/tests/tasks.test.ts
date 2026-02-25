import { describe, it, expect, beforeEach } from "bun:test"; // ← beforeAll eliminado
import { app } from "../src/server";
import type { Task, Subject } from "@dashboard/shared-types";

describe("Tasks API Tests", () => {
  let taskId: string;
  let subjectId: string;
  let token: string;

  beforeEach(async () => {
    // ← era beforeAll
    const loginRes = await app.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "demo@example.com", password: "demo123" }),
      headers: { "Content-Type": "application/json" },
    });
    const auth = (await loginRes.json()) as any;
    token = auth.token;

    const subRes = await app.request("/api/subjects", {
      method: "POST",
      body: JSON.stringify({ name: "Subject for Tasks", total_classes: 10 }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const sub = (await subRes.json()) as Subject;
    subjectId = sub.id;
  });

  it("POST /api/tasks should create a new task", async () => {
    const res = await app.request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        subject_id: subjectId,
        title: "Estudiar para parcial",
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // ← mañana
        description: "Capítulos 1 al 5",
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as Task;
    expect(body.title).toBe("Estudiar para parcial");
    expect(body.subject_id).toBe(subjectId);
    expect(body.status).toBe("todo");
    taskId = body.id;
  });

  it("GET /api/tasks should return all tasks of user", async () => {
    // Crear tarea primero para que la lista no esté vacía
    const createRes = await app.request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        subject_id: subjectId,
        title: "Tarea auxiliar",
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    taskId = ((await createRes.json()) as Task).id;

    const res = await app.request("/api/tasks", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Task[];
    expect(body.length).toBeGreaterThan(0);
  });

  it("GET /api/tasks?subject_id=... should filter tasks", async () => {
    await app.request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        subject_id: subjectId,
        title: "Tarea filtrada",
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const res = await app.request(`/api/tasks?subject_id=${subjectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Task[];
    expect(body.every((t) => t.subject_id === subjectId)).toBe(true);
  });

  it("PATCH /api/tasks/:id/status should update task status", async () => {
    const createRes = await app.request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        subject_id: subjectId,
        title: "Tarea para patchear",
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    taskId = ((await createRes.json()) as Task).id;

    const res = await app.request(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "done" }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as Task;
    expect(body.status).toBe("done");
  });

  it("DELETE /api/tasks/:id should delete the task", async () => {
    const createRes = await app.request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        subject_id: subjectId,
        title: "Tarea para borrar",
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    taskId = ((await createRes.json()) as Task).id;

    const res = await app.request(`/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);

    const checkRes = await app.request(`/api/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(checkRes.status).toBe(404);
  });
});
