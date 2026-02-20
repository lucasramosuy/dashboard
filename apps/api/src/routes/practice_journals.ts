import { Hono } from "hono";
import { readJson, writeJson } from "../lib/db";
import type { PracticeJournal } from "@dashboard/shared-types";
import { randomUUID } from "node:crypto";

const practiceJournalsRouter = new Hono();

// GET all journals (optional filter by subject_id)
practiceJournalsRouter.get("/", async (c) => {
  const subjectId = c.req.query("subject_id");
  let journals = await readJson<PracticeJournal[]>("practice_journals.json");
  
  if (subjectId) {
    journals = journals.filter(j => j.subject_id === subjectId);
  }
  
  return c.json(journals);
});

// GET journal by ID
practiceJournalsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const journals = await readJson<PracticeJournal[]>("practice_journals.json");
  const journal = journals.find(j => j.id === id);
  
  if (!journal) return c.json({ error: "Journal not found" }, 404);
  return c.json(journal);
});

// POST create journal
practiceJournalsRouter.post("/", async (c) => {
  const body = await c.req.json();
  
  if (!body.subject_id || !body.date || !body.content) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const journals = await readJson<PracticeJournal[]>("practice_journals.json");
  const newJournal: PracticeJournal = {
    id: randomUUID(),
    subject_id: body.subject_id,
    date: body.date,
    content: body.content
  };

  journals.push(newJournal);
  await writeJson("practice_journals.json", journals);
  
  return c.json(newJournal, 201);
});

// PUT update journal
practiceJournalsRouter.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const journals = await readJson<PracticeJournal[]>("practice_journals.json");
  const index = journals.findIndex(j => j.id === id);

  if (index === -1) return c.json({ error: "Journal not found" }, 404);

  journals[index] = { ...journals[index], ...body, id }; // Ensure ID remains same
  await writeJson("practice_journals.json", journals);
  
  return c.json(journals[index]);
});

// DELETE journal
practiceJournalsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const journals = await readJson<PracticeJournal[]>("practice_journals.json");
  const filtered = journals.filter(j => j.id !== id);
  
  if (journals.length === filtered.length) {
    return c.json({ error: "Journal not found" }, 404);
  }

  await writeJson("practice_journals.json", filtered);
  return c.json({ status: "deleted" });
});

export { practiceJournalsRouter };
