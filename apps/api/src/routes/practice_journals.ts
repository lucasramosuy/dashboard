import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { dbService } from "../lib/db";
import { JWT_SECRET } from "../lib/auth";
import type { PracticeJournal } from "@dashboard/shared-types";
import { randomUUID } from "node:crypto";

const practiceJournalsRouter = new Hono();

practiceJournalsRouter.use("/*", jwt({ secret: JWT_SECRET, alg: "HS256" }));

// GET all journals (optional filter by subject_id)
practiceJournalsRouter.get("/", async (c) => {
  const payload = c.get("jwtPayload");
  const subjectId = c.req.query("subject_id");

  if (subjectId) {
    // ✅ IDOR fix
    if (!dbService.ownership.subjectBelongsToUser(subjectId, payload.id)) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.json(dbService.journals.getBySubject(subjectId));
  }

  return c.json(dbService.journals.getByUser(payload.id));
});

// GET journal by ID
practiceJournalsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const payload = c.get("jwtPayload");

  // ✅ IDOR fix: verificar ownership via journalBelongsToUser
  if (!dbService.ownership.journalBelongsToUser(id, payload.id)) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(dbService.journals.getById(id));
});

// POST create journal
practiceJournalsRouter.post("/", async (c) => {
  const payload = c.get("jwtPayload");
  const body = await c.req.json();

  if (!body.subject_id || !body.date || !body.content) {
    return c.json({ error: "Missing required fields (subject_id, date, content)" }, 400);
  }

  // ✅ IDOR fix: verificar que el subject pertenece al usuario
  if (!dbService.ownership.subjectBelongsToUser(body.subject_id, payload.id)) {
    return c.json({ error: "Subject not found" }, 404);
  }

  // ✅ Validar fecha
  const parsedDate = new Date(body.date);
  if (isNaN(parsedDate.getTime())) {
    return c.json({ error: "Invalid date format" }, 400);
  }

  const newJournal: PracticeJournal = {
    id: randomUUID(),
    subject_id: body.subject_id,
    date: parsedDate,
    content: String(body.content).trim(),
  };

  dbService.journals.create(newJournal);
  return c.json(newJournal, 201);
});

// PUT update journal content
practiceJournalsRouter.put("/:id", async (c) => {
  const id = c.req.param("id");
  const payload = c.get("jwtPayload");

  // ✅ IDOR fix
  if (!dbService.ownership.journalBelongsToUser(id, payload.id)) {
    return c.json({ error: "Not found" }, 404);
  }

  const body = await c.req.json();
  if (!body.content) {
    return c.json({ error: "content is required" }, 400);
  }

  dbService.journals.update(id, String(body.content).trim());

  return c.json({ ...dbService.journals.getById(id), content: body.content });
});

// DELETE journal
practiceJournalsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const payload = c.get("jwtPayload");

  // ✅ IDOR fix
  if (!dbService.ownership.journalBelongsToUser(id, payload.id)) {
    return c.json({ error: "Not found" }, 404);
  }

  dbService.journals.delete(id);
  return c.json({ status: "deleted" });
});

export { practiceJournalsRouter };
