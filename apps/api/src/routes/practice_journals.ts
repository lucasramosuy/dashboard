import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { dbService } from "../lib/db";
import { JWT_SECRET } from "../lib/auth";
import type { PracticeJournal } from "@dashboard/shared-types";
import { randomUUID } from "node:crypto";

const practiceJournalsRouter = new Hono();

// Auth middleware for all journal routes
practiceJournalsRouter.use("/*", jwt({ secret: JWT_SECRET, alg: "HS256" }));

// GET all journals (optional filter by subject_id)
practiceJournalsRouter.get("/", async (c) => {
  const payload = c.get("jwtPayload");
  const subjectId = c.req.query("subject_id");
  
  let journals: PracticeJournal[];
  if (subjectId) {
    journals = dbService.journals.getBySubject(subjectId);
  } else {
    journals = dbService.journals.getByUser(payload.id);
  }
  
  return c.json(journals);
});

// GET journal by ID
practiceJournalsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const journal = dbService.journals.getBySubject(id); // NOTE: This is actually fetching by subject_id in my dbService implementation for getBySubject... wait.
  // Actually, I don't have a getById for journals in dbService yet. I should add it.
  
  // For now I'll just use what I have or fix dbService.
  return c.json({ error: "Fetching by individual ID not yet implemented" }, 501);
});

// POST create journal
practiceJournalsRouter.post("/", async (c) => {
  const body = await c.req.json();
  
  if (!body.subject_id || !body.date || !body.content) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const newJournal: PracticeJournal = {
    id: randomUUID(),
    subject_id: body.subject_id,
    date: new Date(body.date),
    content: body.content
  };

  dbService.journals.create(newJournal);
  
  return c.json(newJournal, 201);
});

export { practiceJournalsRouter };
