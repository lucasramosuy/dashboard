import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { dbService } from "../lib/db";
import { JWT_SECRET } from "../lib/auth";
import type { Task } from "@dashboard/shared-types";
import { randomUUID } from "node:crypto";

const VALID_STATUSES = ["todo", "in-progress", "done"] as const;
type TaskStatus = (typeof VALID_STATUSES)[number];

const tasksRouter = new Hono();

tasksRouter.use("/*", jwt({ secret: JWT_SECRET, alg: "HS256" }));

// GET all tasks (optional filter by subject_id)
tasksRouter.get("/", async (c) => {
  const payload = c.get("jwtPayload");
  const subjectId = c.req.query("subject_id");

  if (subjectId) {
    // ✅ IDOR fix: verificar que el subject pertenece al usuario antes de filtrar
    if (!(await dbService.ownership.subjectBelongsToUser(subjectId, payload.id))) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.json(await dbService.tasks.getBySubject(subjectId));
  }

  return c.json(await dbService.tasks.getByUser(payload.id));
});

// GET task by ID
tasksRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const payload = c.get("jwtPayload");

  // ✅ IDOR fix
  if (!(await dbService.ownership.taskBelongsToUser(id, payload.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(await dbService.tasks.getById(id));
});

// POST create task
tasksRouter.post("/", async (c) => {
  const payload = c.get("jwtPayload");
  const body = await c.req.json();

  if (!body.subject_id || !body.title || !body.due_date) {
    return c.json({ error: "Missing required fields (subject_id, title, due_date)" }, 400);
  }

  // ✅ IDOR fix: verificar que el subject pertenece al usuario
  if (!(await dbService.ownership.subjectBelongsToUser(body.subject_id, payload.id))) {
    return c.json({ error: "Subject not found" }, 404);
  }

  // ✅ Validar status si se provee
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return c.json({ error: "status must be 'todo', 'in-progress' or 'done'" }, 400);
  }

  const newTask: Task = {
    id: randomUUID(),
    subject_id: body.subject_id,
    title: String(body.title).trim(),
    description: body.description ? String(body.description).trim() : undefined,
    due_date: new Date(body.due_date),
    status: (body.status as TaskStatus) || "todo",
  };

  await dbService.tasks.create(newTask);
  return c.json(newTask, 201);
});

// PATCH /:id/status — debe ir ANTES que PATCH /:id
tasksRouter.patch("/:id/status", async (c) => {
  const id = c.req.param("id");
  const payload = c.get("jwtPayload");

  // ✅ IDOR fix
  if (!(await dbService.ownership.taskBelongsToUser(id, payload.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  const body = await c.req.json();

  // ✅ Validar status
  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return c.json({ error: "status must be 'todo', 'in-progress' or 'done'" }, 400);
  }

  await dbService.tasks.updateStatus(id, body.status);
  return c.json({ ...(await dbService.tasks.getById(id)), status: body.status });
});

// PATCH /:id — actualización genérica
tasksRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const payload = c.get("jwtPayload");

  // ✅ IDOR fix
  if (!(await dbService.ownership.taskBelongsToUser(id, payload.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  const body = await c.req.json();
  const updateData: Partial<Task> = {};

  if (body.title) updateData.title = String(body.title).trim();
  if (body.description !== undefined) updateData.description = String(body.description).trim();
  if (body.due_date) updateData.due_date = new Date(body.due_date);
  if (body.status) {
    // ✅ Validar status
    if (!VALID_STATUSES.includes(body.status)) {
      return c.json({ error: "status must be 'todo', 'in-progress' or 'done'" }, 400);
    }
    updateData.status = body.status as TaskStatus;
  }

  if (Object.keys(updateData).length === 0) {
    return c.json({ error: "No valid fields to update" }, 400);
  }

  await dbService.tasks.update(id, updateData);
  return c.json({ ...(await dbService.tasks.getById(id)), ...updateData });
});

// DELETE task
tasksRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const payload = c.get("jwtPayload");

  // ✅ IDOR fix
  if (!(await dbService.ownership.taskBelongsToUser(id, payload.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  await dbService.tasks.delete(id);
  return c.json({ status: "deleted" });
});

export { tasksRouter };
