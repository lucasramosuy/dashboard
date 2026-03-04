import { Hono } from "hono";

import { dbService } from "../lib/db";

import type { Subject } from "@dashboard/shared-types";
import { randomUUID } from "node:crypto";

import { authMiddleware, type AuthEnv } from "../middleware/auth-middleware";
import { createSubjectSchema, updateSubjectSchema } from "@dashboard/shared-types";
import { subjectsService } from "../services/subjectsService";

const generateSlug = (text: string) => {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
};

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

// GET CFE duration rules
subjectsRouter.get("/cfe-rules", (c) => {
  return c.json(subjectsService.getAllTracks());
});

// GET subject by ID (con promedio de calificaciones)
subjectsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  if (!(await dbService.ownership.subjectBelongsToUser(id, user.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  const subject = await dbService.subjects.getById(id);

  // Pre-computar promedio de grade de las tasks asociadas
  const tasks = await dbService.tasks.getBySubject(id);
  const gradedTasks = tasks.filter((t: any) => t.grade != null);
  const gradeAvg =
    gradedTasks.length > 0
      ? Math.round(
          (gradedTasks.reduce((sum: number, t: any) => sum + Number(t.grade), 0) /
            gradedTasks.length) *
            10,
        ) / 10
      : null;

  return c.json({
    ...subject,
    gradeAvg,
    gradedCount: gradedTasks.length,
    totalTasks: tasks.length,
  });
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
    slug: generateSlug(body.name),
    track: body.track ?? null,
    duration_weeks: body.duration_weeks ?? null,
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
  if (body.name) {
    updateData.name = body.name.trim();
    updateData.slug = generateSlug(body.name);
  }
  if (body.total_classes !== undefined) updateData.total_classes = body.total_classes;
  if (body.track !== undefined) updateData.track = body.track;
  if (body.duration_weeks !== undefined) updateData.duration_weeks = body.duration_weeks;

  await dbService.subjects.update(id, updateData);
  return c.json({ ...(await dbService.subjects.getById(id)), ...updateData });
});

// DELETE subject
subjectsRouter.delete("/:id", async (c) => {
  const idOrSlug = c.req.param("id");
  const user = c.get("user");

  // ✅ IDOR fix
  if (!(await dbService.ownership.subjectBelongsToUser(idOrSlug, user.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  const subject = await dbService.subjects.getById(idOrSlug);
  if (subject) await dbService.subjects.delete(subject.id);

  return c.json({ success: true });
});

export { subjectsRouter };
