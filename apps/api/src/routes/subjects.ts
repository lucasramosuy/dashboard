import { Hono } from "hono";
import { readJson, writeJson } from "../lib/db";
import type { Subject, Absence } from "@dashboard/shared-types";
import { randomUUID } from "node:crypto";

const subjectsRouter = new Hono();

// GET all subjects
subjectsRouter.get("/", async (c) => {
  const subjects = await readJson<Subject[]>("subjects.json");
  return c.json(subjects);
});

// GET at-risk subjects (more than 80% absences based on total_classes)
subjectsRouter.get("/at-risk", async (c) => {
  const subjects = await readJson<Subject[]>("subjects.json");
  const absences = await readJson<Absence[]>("absences.json");

  const atRisk = subjects.map(s => {
    const subjectAbsences = absences
      .filter(a => a.subject_id === s.id)
      .reduce((sum, a) => sum + a.calculated_value, 0);
    
    const percentage = s.total_classes > 0 ? (subjectAbsences / s.total_classes) * 100 : 0;
    
    return {
      ...s,
      currentAbsences: subjectAbsences,
      absencePercentage: percentage,
      status: percentage > 80 ? 'danger' : percentage > 50 ? 'warning' : 'normal'
    };
  }).filter(s => s.status !== 'normal');

  return c.json(atRisk);
});

// GET subject by ID
subjectsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const subjects = await readJson<Subject[]>("subjects.json");
  const subject = subjects.find(s => s.id === id);
  
  if (!subject) return c.json({ error: "Subject not found" }, 404);
  return c.json(subject);
});

// POST create subject
subjectsRouter.post("/", async (c) => {
  const body = await c.req.json();
  
  if (!body.name || body.total_classes === undefined) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const subjects = await readJson<Subject[]>("subjects.json");
  const newSubject: Subject = {
    id: randomUUID(),
    name: body.name,
    total_classes: body.total_classes
  };

  subjects.push(newSubject);
  await writeJson("subjects.json", subjects);
  
  return c.json(newSubject, 201);
});

// PUT update subject
subjectsRouter.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const subjects = await readJson<Subject[]>("subjects.json");
  const index = subjects.findIndex(s => s.id === id);

  if (index === -1) return c.json({ error: "Subject not found" }, 404);

  subjects[index] = { ...subjects[index], ...body, id }; // Ensure ID remains same
  await writeJson("subjects.json", subjects);
  
  return c.json(subjects[index]);
});

// DELETE subject
subjectsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const subjects = await readJson<Subject[]>("subjects.json");
  const filtered = subjects.filter(s => s.id !== id);
  
  if (subjects.length === filtered.length) {
    return c.json({ error: "Subject not found" }, 404);
  }

  await writeJson("subjects.json", filtered);
  return c.json({ status: "deleted" });
});

export { subjectsRouter };
