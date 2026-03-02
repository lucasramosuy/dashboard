import { Hono } from "hono";

import { dbService } from "../lib/db";

import type { PracticeJournal } from "@dashboard/shared-types";
import { randomUUID } from "node:crypto";

import { authMiddleware, type AuthEnv } from "../middleware/auth-middleware";
import { createJournalSchema, updateJournalSchema } from "@dashboard/shared-types";

const practiceJournalsRouter = new Hono<AuthEnv>();

practiceJournalsRouter.use("/*", authMiddleware);

// GET all journals (optional filter by subject_id)
practiceJournalsRouter.get("/", async (c) => {
  const user = c.get("user");
  const subjectId = c.req.query("subject_id");

  if (subjectId) {
    if (!(await dbService.ownership.subjectBelongsToUser(subjectId, user.id))) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.json(await dbService.journals.getBySubject(subjectId));
  }

  return c.json(await dbService.journals.getByUser(user.id));
});

// GET journal by ID
practiceJournalsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  if (!(await dbService.ownership.journalBelongsToUser(id, user.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(await dbService.journals.getById(id));
});

// POST create journal
practiceJournalsRouter.post("/", async (c) => {
  const user = c.get("user");
  const body = createJournalSchema.parse(await c.req.json());

  if (!(await dbService.ownership.subjectBelongsToUser(body.subject_id, user.id))) {
    return c.json({ error: "Subject not found" }, 404);
  }

  const parsedDate = new Date(body.date);
  if (isNaN(parsedDate.getTime())) {
    return c.json({ error: "Invalid date format" }, 400);
  }

  const newJournal: PracticeJournal = {
    id: randomUUID(),
    subject_id: body.subject_id,
    date: parsedDate,
    content: body.content.trim(),
  };

  await dbService.journals.create(newJournal);
  return c.json(newJournal, 201);
});

// PUT update journal content
practiceJournalsRouter.put("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  if (!(await dbService.ownership.journalBelongsToUser(id, user.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  const body = updateJournalSchema.parse(await c.req.json());

  await dbService.journals.update(id, body.content.trim());

  return c.json({ ...(await dbService.journals.getById(id)), content: body.content });
});

// DELETE journal
practiceJournalsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  if (!(await dbService.ownership.journalBelongsToUser(id, user.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  await dbService.journals.delete(id);
  return c.json({ status: "deleted" });
});

export { practiceJournalsRouter };
