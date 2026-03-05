import { Hono } from "hono";

import { dbService } from "../lib/db";

import type { Absence } from "@dashboard/shared-types";
import { randomUUID } from "node:crypto";

import { authMiddleware, type AuthEnv } from "../middleware/auth-middleware";
import { createAbsenceSchema } from "@dashboard/shared-types";

const absencesRouter = new Hono<AuthEnv>();

absencesRouter.use("/*", authMiddleware);

// GET absences (optional filter by subject_id)
absencesRouter.get("/", async (c) => {
  const user = c.get("user");
  const subjectId = c.req.query("subject_id");

  if (subjectId) {
    if (!(await dbService.ownership.subjectBelongsToUser(subjectId, user.id))) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.json(await dbService.absences.getBySubject(subjectId));
  }

  return c.json(await dbService.absences.getByUser(user.id));
});

// POST create absence
absencesRouter.post("/", async (c) => {
  const user = c.get("user");
  const body = createAbsenceSchema.parse(await c.req.json());

  if (!(await dbService.ownership.subjectBelongsToUser(body.subject_id, user.id))) {
    return c.json({ error: "Subject not found" }, 404);
  }

  const parsedDate = new Date(body.date);
  if (isNaN(parsedDate.getTime())) {
    return c.json({ error: "Invalid date format" }, 400);
  }

  const newAbsence: Absence = {
    id: randomUUID(),
    subject_id: body.subject_id,
    date: parsedDate,
    type: body.type,
    calculated_value: body.type === "justified" ? 0.5 : 1.0,
  };

  await dbService.absences.create(newAbsence);
  return c.json(newAbsence, 201);
});

// DELETE absence
absencesRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  if (!(await dbService.ownership.absenceBelongsToUser(id, user.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  await dbService.absences.delete(id);
  return c.json({ status: "deleted" });
});

export { absencesRouter };
