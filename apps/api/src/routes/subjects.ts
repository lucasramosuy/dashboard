import { Hono } from "hono";

import { dbService } from "../lib/db";

import type { Subject } from "@dashboard/shared-types";
import { randomUUID } from "node:crypto";

import { authMiddleware, type AuthEnv } from "../middleware/auth-middleware";
import { createSubjectSchema, updateSubjectSchema } from "@dashboard/shared-types";

const subjectsRouter = new Hono<AuthEnv>();

subjectsRouter.use("/*", authMiddleware);

// GET all subjects
subjectsRouter.get("/", async (c) => {
  const user = c.get("user");
  return c.json(await dbService.subjects.getAll(user.id));
});

// GET at-risk subjects
subjectsRouter.get("/at-risk", async (c) => {
  const user = c.get("user");
  const subjects = await dbService.subjects.getAll(user.id);

  const results = await Promise.all(
    subjects.map(async (s) => {
      const absences = await dbService.absences.getBySubject(s.id);
      const totalAbsenceValue = absences.reduce((sum, a) => sum + a.calculated_value, 0);
      const percentage = s.total_classes > 0 ? (totalAbsenceValue / s.total_classes) * 100 : 0;

      let status: "normal" | "warning" | "danger" = "normal";
      if (percentage >= 20) status = "danger";
      else if (percentage >= 15) status = "warning";

      return {
        ...s,
        currentAbsences: totalAbsenceValue,
        absencePercentage: percentage,
        status,
      };
    }),
  );

  return c.json(results.filter((s) => s.status !== "normal"));
});

// GET subject by ID
subjectsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  if (!(await dbService.ownership.subjectBelongsToUser(id, user.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(await dbService.subjects.getById(id));
});

// POST create subject
subjectsRouter.post("/", async (c) => {
  const user = c.get("user");
  const body = createSubjectSchema.parse(await c.req.json());

  const newSubject: Subject = {
    id: randomUUID(),
    name: body.name.trim(),
    total_classes: body.total_classes,
    user_id: user.id,
  };

  await dbService.subjects.create(newSubject);
  return c.json(newSubject, 201);
});

// PATCH update subject
subjectsRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  if (!(await dbService.ownership.subjectBelongsToUser(id, user.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  const body = updateSubjectSchema.parse(await c.req.json());
  const updateData: Partial<Subject> = {};
  if (body.name) updateData.name = body.name.trim();
  if (body.total_classes !== undefined) updateData.total_classes = body.total_classes;

  await dbService.subjects.update(id, updateData);
  return c.json({ ...(await dbService.subjects.getById(id)), ...updateData });
});

// DELETE subject
subjectsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  // ✅ IDOR fix
  if (!(await dbService.ownership.subjectBelongsToUser(id, user.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  await dbService.subjects.delete(id);
  return c.json({ status: "deleted" });
});

export { subjectsRouter };
