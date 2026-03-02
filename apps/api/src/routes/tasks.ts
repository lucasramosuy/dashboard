import { Hono } from "hono";

import { dbService } from "../lib/db";

import type { Task } from "@dashboard/shared-types";
import { randomUUID } from "node:crypto";

import { authMiddleware, type AuthEnv } from "../middleware/auth-middleware";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "@dashboard/shared-types";

const tasksRouter = new Hono<AuthEnv>();

tasksRouter.use("/*", authMiddleware);

// GET all tasks (optional filter by subject_id)
tasksRouter.get("/", async (c) => {
  const user = c.get("user");
  const subjectId = c.req.query("subject_id");

  if (subjectId) {
    if (!(await dbService.ownership.subjectBelongsToUser(subjectId, user.id))) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.json(await dbService.tasks.getBySubject(subjectId));
  }

  return c.json(await dbService.tasks.getByUser(user.id));
});

// GET task by ID
tasksRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  if (!(await dbService.ownership.taskBelongsToUser(id, user.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(await dbService.tasks.getById(id));
});

// POST create task
tasksRouter.post("/", async (c) => {
  const user = c.get("user");
  const body = createTaskSchema.parse(await c.req.json());

  if (!(await dbService.ownership.subjectBelongsToUser(body.subject_id, user.id))) {
    return c.json({ error: "Subject not found" }, 404);
  }

  const newTask: Task = {
    id: randomUUID(),
    subject_id: body.subject_id,
    title: body.title.trim(),
    description: body.description?.trim(),
    due_date: new Date(body.due_date),
    status: body.status || "todo",
  };

  await dbService.tasks.create(newTask);
  return c.json(newTask, 201);
});

// PATCH /:id/status — debe ir ANTES que PATCH /:id
tasksRouter.patch("/:id/status", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  if (!(await dbService.ownership.taskBelongsToUser(id, user.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  const body = updateTaskStatusSchema.parse(await c.req.json());

  await dbService.tasks.updateStatus(id, body.status);
  return c.json({ ...(await dbService.tasks.getById(id)), status: body.status });
});

// PATCH /:id — actualización genérica
tasksRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  if (!(await dbService.ownership.taskBelongsToUser(id, user.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  const body = updateTaskSchema.parse(await c.req.json());
  const updateData: Partial<Task> = {};

  if (body.title) updateData.title = body.title.trim();
  if (body.description !== undefined) updateData.description = body.description.trim();
  if (body.due_date) updateData.due_date = new Date(body.due_date);
  if (body.status) updateData.status = body.status;

  await dbService.tasks.update(id, updateData);
  return c.json({ ...(await dbService.tasks.getById(id)), ...updateData });
});

// DELETE task
tasksRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  if (!(await dbService.ownership.taskBelongsToUser(id, user.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  await dbService.tasks.delete(id);
  return c.json({ status: "deleted" });
});

export { tasksRouter };
