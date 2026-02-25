import { createClient } from "@libsql/client";
import type { InValue } from "@libsql/client";
import { UserPublic, Subject, Task, Absence, PracticeJournal } from "@dashboard/shared-types";

// --- DB CONFIG ---
const getDbConfig = () => {
  if (Bun.env.NODE_ENV === "test") {
    return { url: "file::memory:" };
  }
  if (Bun.env.TURSO_DATABASE_URL) {
    return {
      url: Bun.env.TURSO_DATABASE_URL,
      authToken: Bun.env.TURSO_AUTH_TOKEN ?? "",
    };
  }
  // dev fallback — archivo local, igual que antes
  const dbPath = Bun.env.DATABASE_PATH ?? "./data/database.sqlite";
  return { url: `file:${dbPath}` };
};

export const db = createClient(getDbConfig());

// --- INIT ---
export async function initDB() {
  await db.batch(
    [
      "PRAGMA foreign_keys = ON",
      `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT DEFAULT 'user'
    )`,
      `CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      total_classes INTEGER DEFAULT 0,
      user_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
      `CREATE TABLE IF NOT EXISTS absences (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT CHECK(type IN ('standard', 'justified')) NOT NULL,
      calculated_value REAL NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    )`,
      `CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT CHECK(status IN ('todo', 'in-progress', 'done')) DEFAULT 'todo',
      due_date TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    )`,
      `CREATE TABLE IF NOT EXISTS practice_journals (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      date TEXT NOT NULL,
      content TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    )`,
    ],
    "write",
  );

  const location = Bun.env.TURSO_DATABASE_URL ?? "local file";
  console.log(`[DB] Database initialized: ${location}`);
}

// --- HELPERS ---

// Extrae solo las propiedades nombradas de una Row de libsql
// (evita las claves numéricas del array subyacente)
function toObj<T>(row: any): T {
  if (!row) return row;
  const obj: any = {};
  for (const key of Object.keys(row)) {
    if (isNaN(Number(key))) obj[key] = row[key];
  }
  return obj as T;
}

function toDate<T>(row: any): T {
  if (!row) return row;
  const target = toObj<any>(row);
  if (target.date) target.date = new Date(target.date as string);
  if (target.due_date) target.due_date = new Date(target.due_date as string);
  return target as T;
}

function sanitizeValues(values: any[]): InValue[] {
  return values.map((v) => {
    if (v instanceof Date) return v.toISOString();
    if (v === undefined) return null;
    return v as InValue;
  });
}

// --- SERVICE ---
export const dbService = {
  run: async (sql: string, params: any[] = []) => {
    return db.execute({ sql, args: sanitizeValues(params) });
  },

  // --- USERS ---
  users: {
    getByEmail: async (email: string): Promise<UserPublic | null> => {
      const r = await db.execute({
        sql: "SELECT * FROM users WHERE email = ?",
        args: [email],
      });
      return r.rows[0] ? toObj<UserPublic>(r.rows[0]) : null;
    },

    getById: async (id: string): Promise<UserPublic | null> => {
      const r = await db.execute({
        sql: "SELECT * FROM users WHERE id = ?",
        args: [id],
      });
      return r.rows[0] ? toObj<UserPublic>(r.rows[0]) : null;
    },

    create: async (user: UserPublic) => {
      return db.execute({
        sql: "INSERT INTO users (id, name, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)",
        args: sanitizeValues([
          user.id,
          user.name,
          user.email,
          user.passwordHash,
          user.role || "user",
        ]),
      });
    },
  },

  // --- SUBJECTS ---
  subjects: {
    getAll: async (userId: string): Promise<Subject[]> => {
      const r = await db.execute({
        sql: "SELECT * FROM subjects WHERE user_id = ?",
        args: [userId],
      });
      return r.rows.map(toObj<Subject>);
    },

    getById: async (id: string): Promise<Subject | null> => {
      const r = await db.execute({
        sql: "SELECT * FROM subjects WHERE id = ?",
        args: [id],
      });
      return r.rows[0] ? toObj<Subject>(r.rows[0]) : null;
    },

    create: async (subject: Subject) => {
      return db.execute({
        sql: "INSERT INTO subjects (id, name, total_classes, user_id) VALUES (?, ?, ?, ?)",
        args: sanitizeValues([subject.id, subject.name, subject.total_classes, subject.user_id]),
      });
    },

    update: async (id: string, data: Partial<Subject>) => {
      const sets = Object.keys(data)
        .map((k) => `${k} = ?`)
        .join(", ");
      const values = [...Object.values(data), id];
      return db.execute({
        sql: `UPDATE subjects SET ${sets} WHERE id = ?`,
        args: sanitizeValues(values),
      });
    },

    delete: async (id: string) => {
      return db.execute({
        sql: "DELETE FROM subjects WHERE id = ?",
        args: [id],
      });
    },
  },

  // --- TASKS ---
  tasks: {
    getBySubject: async (subjectId: string): Promise<Task[]> => {
      const r = await db.execute({
        sql: "SELECT * FROM tasks WHERE subject_id = ?",
        args: [subjectId],
      });
      return r.rows.map(toDate<Task>);
    },

    getByUser: async (userId: string): Promise<Task[]> => {
      const r = await db.execute({
        sql: `SELECT t.* FROM tasks t JOIN subjects s ON t.subject_id = s.id WHERE s.user_id = ?`,
        args: [userId],
      });
      return r.rows.map(toDate<Task>);
    },

    getById: async (id: string): Promise<Task | null> => {
      const r = await db.execute({
        sql: "SELECT * FROM tasks WHERE id = ?",
        args: [id],
      });
      return r.rows[0] ? toDate<Task>(r.rows[0]) : null;
    },

    create: async (task: Task) => {
      return db.execute({
        sql: "INSERT INTO tasks (id, subject_id, title, description, status, due_date) VALUES (?, ?, ?, ?, ?, ?)",
        args: sanitizeValues([
          task.id,
          task.subject_id,
          task.title,
          task.description,
          task.status,
          task.due_date,
        ]),
      });
    },

    update: async (id: string, data: Partial<Task>) => {
      const sets = Object.keys(data)
        .map((k) => `${k} = ?`)
        .join(", ");
      const values = [...Object.values(data), id];
      return db.execute({
        sql: `UPDATE tasks SET ${sets} WHERE id = ?`,
        args: sanitizeValues(values),
      });
    },

    updateStatus: async (id: string, status: string) => {
      return db.execute({
        sql: "UPDATE tasks SET status = ? WHERE id = ?",
        args: [status, id],
      });
    },

    delete: async (id: string) => {
      return db.execute({ sql: "DELETE FROM tasks WHERE id = ?", args: [id] });
    },
  },

  // --- ABSENCES ---
  absences: {
    getBySubject: async (subjectId: string): Promise<Absence[]> => {
      const r = await db.execute({
        sql: "SELECT * FROM absences WHERE subject_id = ?",
        args: [subjectId],
      });
      return r.rows.map(toDate<Absence>);
    },

    getByUser: async (userId: string): Promise<Absence[]> => {
      const r = await db.execute({
        sql: `SELECT a.* FROM absences a JOIN subjects s ON a.subject_id = s.id WHERE s.user_id = ?`,
        args: [userId],
      });
      return r.rows.map(toDate<Absence>);
    },

    create: async (absence: Absence) => {
      return db.execute({
        sql: "INSERT INTO absences (id, subject_id, date, type, calculated_value) VALUES (?, ?, ?, ?, ?)",
        args: sanitizeValues([
          absence.id,
          absence.subject_id,
          absence.date,
          absence.type,
          absence.calculated_value,
        ]),
      });
    },

    delete: async (id: string) => {
      return db.execute({
        sql: "DELETE FROM absences WHERE id = ?",
        args: [id],
      });
    },
  },

  // --- JOURNALS ---
  journals: {
    getBySubject: async (subjectId: string): Promise<PracticeJournal[]> => {
      const r = await db.execute({
        sql: "SELECT * FROM practice_journals WHERE subject_id = ?",
        args: [subjectId],
      });
      return r.rows.map(toDate<PracticeJournal>);
    },

    getByUser: async (userId: string): Promise<PracticeJournal[]> => {
      const r = await db.execute({
        sql: `SELECT j.* FROM practice_journals j JOIN subjects s ON j.subject_id = s.id WHERE s.user_id = ?`,
        args: [userId],
      });
      return r.rows.map(toDate<PracticeJournal>);
    },

    getById: async (id: string): Promise<PracticeJournal | null> => {
      const r = await db.execute({
        sql: "SELECT * FROM practice_journals WHERE id = ?",
        args: [id],
      });
      return r.rows[0] ? toDate<PracticeJournal>(r.rows[0]) : null;
    },

    create: async (journal: PracticeJournal) => {
      return db.execute({
        sql: "INSERT INTO practice_journals (id, subject_id, date, content) VALUES (?, ?, ?, ?)",
        args: sanitizeValues([journal.id, journal.subject_id, journal.date, journal.content]),
      });
    },

    update: async (id: string, content: string) => {
      return db.execute({
        sql: "UPDATE practice_journals SET content = ? WHERE id = ?",
        args: [content, id],
      });
    },

    delete: async (id: string) => {
      return db.execute({
        sql: "DELETE FROM practice_journals WHERE id = ?",
        args: [id],
      });
    },
  },

  // --- OWNERSHIP ---
  ownership: {
    subjectBelongsToUser: async (subjectId: string, userId: string): Promise<boolean> => {
      const r = await db.execute({
        sql: "SELECT id FROM subjects WHERE id = ? AND user_id = ?",
        args: [subjectId, userId],
      });
      return r.rows.length > 0;
    },

    taskBelongsToUser: async (taskId: string, userId: string): Promise<boolean> => {
      const r = await db.execute({
        sql: `SELECT t.id FROM tasks t JOIN subjects s ON t.subject_id = s.id WHERE t.id = ? AND s.user_id = ?`,
        args: [taskId, userId],
      });
      return r.rows.length > 0;
    },

    absenceBelongsToUser: async (absenceId: string, userId: string): Promise<boolean> => {
      const r = await db.execute({
        sql: `SELECT a.id FROM absences a JOIN subjects s ON a.subject_id = s.id WHERE a.id = ? AND s.user_id = ?`,
        args: [absenceId, userId],
      });
      return r.rows.length > 0;
    },

    journalBelongsToUser: async (journalId: string, userId: string): Promise<boolean> => {
      const r = await db.execute({
        sql: `SELECT j.id FROM practice_journals j JOIN subjects s ON j.subject_id = s.id WHERE j.id = ? AND s.user_id = ?`,
        args: [journalId, userId],
      });
      return r.rows.length > 0;
    },
  },
};
