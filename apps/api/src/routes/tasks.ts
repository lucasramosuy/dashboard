import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { dbService } from "../lib/db";
import { JWT_SECRET } from "../lib/auth";
import type { Task } from "@dashboard/shared-types";
import { randomUUID } from "node:crypto";

const tasksRouter = new Hono();

// Auth middleware for all task routes
tasksRouter.use("/*", jwt({ secret: JWT_SECRET, alg: "HS256" }));

// GET all tasks (optional filter by subject_id)
tasksRouter.get("/", async (c) => {
  const payload = c.get("jwtPayload");
  const subjectId = c.req.query("subject_id");
  
  let tasks: Task[];
  if (subjectId) {
    tasks = dbService.tasks.getBySubject(subjectId);
  } else {
    tasks = dbService.tasks.getByUser(payload.id);
  }
  
  return c.json(tasks);
});

// GET task by ID
tasksRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const task = dbService.tasks.getById(id);
  
  if (!task) return c.json({ error: "Task not found" }, 404);
  return c.json(task);
});

// POST create task
tasksRouter.post("/", async (c) => {
  const body = await c.req.json();
  
  if (!body.subject_id || !body.title || !body.due_date) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const newTask: Task = {
    id: randomUUID(),
    subject_id: body.subject_id,
    title: body.title,
    description: body.description || null,
    due_date: new Date(body.due_date),
    status: body.status || "todo"
  };

  dbService.tasks.create(newTask);
  
  return c.json(newTask, 201);
});

// PATCH update task (generic)
tasksRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const existing = dbService.tasks.getById(id);

  if (!existing) return c.json({ error: "Task not found" }, 404);

  // Filter allowed fields
  const updateData: Partial<Task> = {};
  if (body.title) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.status) updateData.status = body.status;
  if (body.due_date) updateData.due_date = new Date(body.due_date);

  if (Object.keys(updateData).length === 0) {
    return c.json({ error: "No valid fields to update" }, 400);
  }

  dbService.tasks.update(id, updateData);
  
  return c.json({ ...existing, ...updateData });
});

// PATCH update task status (legacy/convenience)
tasksRouter.patch("/:id/status", async (c) => {
  const id = c.req.param("id");
  const { status } = await c.req.json();
  
  if (!status) return c.json({ error: "Missing status" }, 400);
  
  const existing = dbService.tasks.getById(id);
  if (!existing) return c.json({ error: "Task not found" }, 404);
  
  dbService.tasks.updateStatus(id, status);
  return c.json({ ...existing, status });
});

// DELETE task
tasksRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = dbService.tasks.getById(id);
  
  if (!existing) {
    return c.json({ error: "Task not found" }, 404);
  }

  dbService.tasks.delete(id);
  return c.json({ status: "deleted" });
});

export { tasksRouter };
