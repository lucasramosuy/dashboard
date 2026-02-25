import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { dbService } from "../lib/db";
import { JWT_SECRET } from "../lib/auth";
import type { Absence } from "@dashboard/shared-types";
import { randomUUID } from "node:crypto";

const VALID_ABSENCE_TYPES = ["standard", "justified"] as const;
type AbsenceType = (typeof VALID_ABSENCE_TYPES)[number];

const absencesRouter = new Hono();

absencesRouter.use("/*", jwt({ secret: JWT_SECRET, alg: "HS256" }));

// GET absences (optional filter by subject_id)
absencesRouter.get("/", async (c) => {
  const payload = c.get("jwtPayload");
  const subjectId = c.req.query("subject_id");

  if (subjectId) {
    // ✅ IDOR fix: verificar que el subject pertenece al usuario
    if (!(await dbService.ownership.subjectBelongsToUser(subjectId, payload.id))) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.json(await dbService.absences.getBySubject(subjectId));
  }

  return c.json(await dbService.absences.getByUser(payload.id));
});

// POST create absence
absencesRouter.post("/", async (c) => {
  const payload = c.get("jwtPayload");
  const body = await c.req.json();

  if (!body.subject_id || !body.date || !body.type) {
    return c.json({ error: "Missing required fields (subject_id, date, type)" }, 400);
  }

  // ✅ Validar type antes de llegar a la DB
  if (!VALID_ABSENCE_TYPES.includes(body.type)) {
    return c.json({ error: "type must be 'standard' or 'justified'" }, 400);
  }

  // ✅ IDOR fix: verificar que el subject pertenece al usuario
  if (!(await dbService.ownership.subjectBelongsToUser(body.subject_id, payload.id))) {
    return c.json({ error: "Subject not found" }, 404);
  }

  // ✅ Validar que la fecha sea parseable
  const parsedDate = new Date(body.date);
  if (isNaN(parsedDate.getTime())) {
    return c.json({ error: "Invalid date format" }, 400);
  }

  const newAbsence: Absence = {
    id: randomUUID(),
    subject_id: body.subject_id,
    date: parsedDate,
    type: body.type as AbsenceType,
    calculated_value: body.type === "justified" ? 0.5 : 1.0,
  };

  await dbService.absences.create(newAbsence);
  return c.json(newAbsence, 201);
});

// DELETE absence
absencesRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const payload = c.get("jwtPayload");

  // ✅ IDOR fix: verificar ownership antes de borrar
  if (!(await dbService.ownership.absenceBelongsToUser(id, payload.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  await dbService.absences.delete(id);
  return c.json({ status: "deleted" });
});

export { absencesRouter };
