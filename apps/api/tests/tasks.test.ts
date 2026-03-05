import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/server";
import { auth } from "../src/lib/auth.better";
import type { Task, Subject } from "@dashboard/shared-types";

async function getTestCookie(): Promise<string> {
  const email = `tasks-${Date.now()}@test.com`;
  await auth.api.signUpEmail({ body: { email, password: "test12345", name: "Test" } });
  const res = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password: "test12345" }),
    headers: { "Content-Type": "application/json" },
  });
  return res.headers.get("set-cookie") || "";
}

describe("Tasks API Tests", () => {
  let taskId: string;
  let subjectId: string;
  let cookie: string;

  beforeEach(async () => {
    cookie = await getTestCookie();

    const subRes = await app.request("/api/subjects", {
      method: "POST",
      body: JSON.stringify({ name: "Subject for Tasks", total_classes: 10 }),
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
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
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        description: "Capítulos 1 al 5",
      }),
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
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
    const createRes = await app.request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        subject_id: subjectId,
        title: "Tarea auxiliar",
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      }),
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
    });
    taskId = ((await createRes.json()) as Task).id;

    const res = await app.request("/api/tasks", {
      headers: { Cookie: cookie },
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
        Cookie: cookie,
      },
    });

    const res = await app.request(`/api/tasks?subject_id=${subjectId}`, {
      headers: { Cookie: cookie },
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
        Cookie: cookie,
      },
    });
    taskId = ((await createRes.json()) as Task).id;

    const res = await app.request(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "done" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
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
        Cookie: cookie,
      },
    });
    taskId = ((await createRes.json()) as Task).id;

    const res = await app.request(`/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);

    const checkRes = await app.request(`/api/tasks/${taskId}`, {
      headers: { Cookie: cookie },
    });
    expect(checkRes.status).toBe(404);
  });
});
