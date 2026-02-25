import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { dbService } from "../lib/db";
import { JWT_SECRET } from "../lib/auth";
import type { Subject } from "@dashboard/shared-types";
import { randomUUID } from "node:crypto";

const subjectsRouter = new Hono();

subjectsRouter.use("/*", jwt({ secret: JWT_SECRET, alg: "HS256" }));

// GET all subjects
subjectsRouter.get("/", async (c) => {
  const payload = c.get("jwtPayload");
  return c.json(await dbService.subjects.getAll(payload.id));
});

// GET at-risk subjects
subjectsRouter.get("/at-risk", async (c) => {
  const payload = c.get("jwtPayload");
  const subjects = await dbService.subjects.getAll(payload.id);

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
  const payload = c.get("jwtPayload");

  // ✅ IDOR fix: verificar ownership antes de devolver el recurso
  if (!(await dbService.ownership.subjectBelongsToUser(id, payload.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(await dbService.subjects.getById(id));
});

// POST create subject
subjectsRouter.post("/", async (c) => {
  const payload = c.get("jwtPayload");
  const body = await c.req.json();

  if (!body.name || body.total_classes === undefined) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  if (typeof body.total_classes !== "number" || body.total_classes < 0) {
    return c.json({ error: "total_classes must be a non-negative number" }, 400);
  }

  const newSubject: Subject = {
    id: randomUUID(),
    name: String(body.name).trim(),
    total_classes: body.total_classes,
    user_id: payload.id,
  };

  await dbService.subjects.create(newSubject);
  return c.json(newSubject, 201);
});

// PATCH update subject
subjectsRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const payload = c.get("jwtPayload");

  // ✅ IDOR fix
  if (!(await dbService.ownership.subjectBelongsToUser(id, payload.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  const body = await c.req.json();
  const updateData: Partial<Subject> = {};
  if (body.name) updateData.name = String(body.name).trim();
  if (body.total_classes !== undefined) {
    if (typeof body.total_classes !== "number" || body.total_classes < 0) {
      return c.json({ error: "total_classes must be a non-negative number" }, 400);
    }
    updateData.total_classes = body.total_classes;
  }

  if (Object.keys(updateData).length === 0) {
    return c.json({ error: "No valid fields to update" }, 400);
  }

  await dbService.subjects.update(id, updateData);
  return c.json({ ...(await dbService.subjects.getById(id)), ...updateData });
});

// DELETE subject
subjectsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const payload = c.get("jwtPayload");

  // ✅ IDOR fix
  if (!(await dbService.ownership.subjectBelongsToUser(id, payload.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  await dbService.subjects.delete(id);
  return c.json({ status: "deleted" });
});

export { subjectsRouter };
