import { Hono } from "hono";
import { readJson, writeJson } from "../lib/db";
import type { Task } from "@dashboard/shared-types";
import { randomUUID } from "node:crypto";

const tasksRouter = new Hono();

// GET all tasks (optional filter by subject_id)
tasksRouter.get("/", async (c) => {
  const subjectId = c.req.query("subject_id");
  let tasks = await readJson<Task[]>("tasks.json");
  
  if (subjectId) {
    tasks = tasks.filter(t => t.subject_id === subjectId);
  }
  
  return c.json(tasks);
});

// GET task by ID
tasksRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const tasks = await readJson<Task[]>("tasks.json");
  const task = tasks.find(t => t.id === id);
  
  if (!task) return c.json({ error: "Task not found" }, 404);
  return c.json(task);
});

// POST create task
tasksRouter.post("/", async (c) => {
  const body = await c.req.json();
  
  if (!body.subject_id || !body.title || !body.due_date) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const tasks = await readJson<Task[]>("tasks.json");
  const newTask: Task = {
    id: randomUUID(),
    subject_id: body.subject_id,
    title: body.title,
    description: body.description || "",
    due_date: body.due_date,
    status: body.status || "pending"
  };

  tasks.push(newTask);
  await writeJson("tasks.json", tasks);
  
  return c.json(newTask, 201);
});

// PUT update task
tasksRouter.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const tasks = await readJson<Task[]>("tasks.json");
  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) return c.json({ error: "Task not found" }, 404);

  tasks[index] = { ...tasks[index], ...body, id }; // Ensure ID remains same
  await writeJson("tasks.json", tasks);
  
  return c.json(tasks[index]);
});

// DELETE task
tasksRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const tasks = await readJson<Task[]>("tasks.json");
  const filtered = tasks.filter(t => t.id !== id);
  
  if (tasks.length === filtered.length) {
    return c.json({ error: "Task not found" }, 404);
  }

  await writeJson("tasks.json", filtered);
  return c.json({ status: "deleted" });
});

export { tasksRouter };
