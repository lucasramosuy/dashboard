import { Database, type SQLQueryBindings } from "bun:sqlite";
import { join } from "path";
import {
  UserPublic,
  Subject,
  Task,
  Absence,
  PracticeJournal,
} from "@dashboard/shared-types";

const DB_PATH =
  Bun.env.NODE_ENV === "test"
    ? ":memory:"
    : Bun.env.DATABASE_PATH ||
      join(import.meta.dir, "../../data/database.sqlite");

// Singleton de la base de datos
export const db = new Database(DB_PATH, { create: true });

export function initDB() {
  db.run("PRAGMA foreign_keys = ON;");

  db.transaction(() => {
    // Users
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        role TEXT DEFAULT 'user'
      )
    `);

    // Subjects
    db.run(`
      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        total_classes INTEGER DEFAULT 0,
        user_id TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Absences
    db.run(`
      CREATE TABLE IF NOT EXISTS absences (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        date TEXT NOT NULL,
        type TEXT CHECK(type IN ('standard', 'justified')) NOT NULL,
        calculated_value REAL NOT NULL,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      )
    `);

    // Tasks
    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT CHECK(status IN ('todo', 'in-progress', 'done')) DEFAULT 'todo',
        due_date TEXT NOT NULL,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      )
    `);

    // Practice Journals
    db.run(`
      CREATE TABLE IF NOT EXISTS practice_journals (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        date TEXT NOT NULL,
        content TEXT NOT NULL,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      )
    `);
  })();

  console.log(`[DB] SQLite inicializada en: ${DB_PATH}`);
}

/**
 * Helper para convertir fechas de SQLite (strings) a objetos Date de JS
 */
function toDate<T>(row: any): T {
  if (!row) return row;
  const target = { ...row };
  if (target.date) target.date = new Date(target.date);
  if (target.due_date) target.due_date = new Date(target.due_date);
  return target as T;
}

/**
 * Utility para limpiar valores antes de enviarlos a SQLite.
 * Convierte Date a ISO string y undefined a null.
 */
function sanitizeValues(values: any[]): SQLQueryBindings[] {
  return values.map((v) => {
    if (v instanceof Date) return v.toISOString();
    if (v === undefined) return null;
    return v as SQLQueryBindings;
  });
}

export const dbService = {
  /**
   * Ejecuta una sentencia SQL de forma segura.
   * Utiliza sanitizeValues para procesar bindings.
   */
  run: (sql: string, params: any[] = []) => {
    return db.prepare(sql).run(...sanitizeValues(params));
  },

  // --- USERS ---
  users: {
    getByEmail: (email: string): UserPublic | null =>
      db
        .prepare("SELECT * FROM users WHERE email = ?")
        .get(email) as UserPublic | null,

    getById: (id: string): UserPublic | null =>
      db
        .prepare("SELECT * FROM users WHERE id = ?")
        .get(id) as UserPublic | null,

    create: (user: UserPublic) =>
      db
        .prepare(
          "INSERT INTO users (id, name, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)",
        )
        .run(
          ...sanitizeValues([
            user.id,
            user.name,
            user.email,
            user.passwordHash,
            user.role || "user",
          ]),
        ),
  },

  // --- SUBJECTS ---
  subjects: {
    getAll: (userId: string): Subject[] =>
      db
        .prepare("SELECT * FROM subjects WHERE user_id = ?")
        .all(userId) as Subject[],

    getById: (id: string): Subject | null =>
      db
        .prepare("SELECT * FROM subjects WHERE id = ?")
        .get(id) as Subject | null,

    create: (subject: Subject) =>
      db
        .prepare(
          "INSERT INTO subjects (id, name, total_classes, user_id) VALUES (?, ?, ?, ?)",
        )
        .run(
          ...sanitizeValues([
            subject.id,
            subject.name,
            subject.total_classes,
            subject.user_id,
          ]),
        ),

    update: (id: string, data: Partial<Subject>) => {
      const sets = Object.keys(data)
        .map((k) => `${k} = ?`)
        .join(", ");
      const values = [...Object.values(data), id];
      db.prepare(`UPDATE subjects SET ${sets} WHERE id = ?`).run(
        ...sanitizeValues(values),
      );
    },

    delete: (id: string) =>
      db.prepare("DELETE FROM subjects WHERE id = ?").run(id),
  },

  // --- TASKS ---
  tasks: {
    getBySubject: (subjectId: string): Task[] =>
      db
        .prepare("SELECT * FROM tasks WHERE subject_id = ?")
        .all(subjectId)
        .map(toDate<Task>),

    getByUser: (userId: string): Task[] =>
      db
        .prepare(
          `
        SELECT t.* FROM tasks t
        JOIN subjects s ON t.subject_id = s.id
        WHERE s.user_id = ?
      `,
        )
        .all(userId)
        .map(toDate<Task>),

    getById: (id: string): Task | null =>
      toDate<Task>(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id)),

    create: (task: Task) =>
      db
        .prepare(
          "INSERT INTO tasks (id, subject_id, title, description, status, due_date) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(
          ...sanitizeValues([
            task.id,
            task.subject_id,
            task.title,
            task.description,
            task.status,
            task.due_date,
          ]),
        ),

    update: (id: string, data: Partial<Task>) => {
      const sets = Object.keys(data)
        .map((k) => `${k} = ?`)
        .join(", ");
      const values = [...Object.values(data), id];
      db.prepare(`UPDATE tasks SET ${sets} WHERE id = ?`).run(
        ...sanitizeValues(values),
      );
    },

    updateStatus: (id: string, status: string) =>
      db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(status, id),

    delete: (id: string) =>
      db.prepare("DELETE FROM tasks WHERE id = ?").run(id),
  },

  // --- ABSENCES ---
  absences: {
    getBySubject: (subjectId: string): Absence[] =>
      db
        .prepare("SELECT * FROM absences WHERE subject_id = ?")
        .all(subjectId)
        .map(toDate<Absence>),

    getByUser: (userId: string): Absence[] =>
      db
        .prepare(
          `
        SELECT a.* FROM absences a
        JOIN subjects s ON a.subject_id = s.id
        WHERE s.user_id = ?
      `,
        )
        .all(userId)
        .map(toDate<Absence>),

    create: (absence: Absence) =>
      db
        .prepare(
          "INSERT INTO absences (id, subject_id, date, type, calculated_value) VALUES (?, ?, ?, ?, ?)",
        )
        .run(
          ...sanitizeValues([
            absence.id,
            absence.subject_id,
            absence.date,
            absence.type,
            absence.calculated_value,
          ]),
        ),

    delete: (id: string) =>
      db.prepare("DELETE FROM absences WHERE id = ?").run(id),
  },

  // --- JOURNALS ---
  journals: {
    getBySubject: (subjectId: string): PracticeJournal[] =>
      db
        .prepare("SELECT * FROM practice_journals WHERE subject_id = ?")
        .all(subjectId)
        .map(toDate<PracticeJournal>),

    getByUser: (userId: string): PracticeJournal[] =>
      db
        .prepare(
          `
      SELECT j.* FROM practice_journals j
      JOIN subjects s ON j.subject_id = s.id
      WHERE s.user_id = ?
    `,
        )
        .all(userId)
        .map(toDate<PracticeJournal>),

    getById: (id: string): PracticeJournal | null =>
      // ← nuevo
      toDate<PracticeJournal>(
        db.prepare("SELECT * FROM practice_journals WHERE id = ?").get(id),
      ),

    create: (journal: PracticeJournal) =>
      db
        .prepare(
          "INSERT INTO practice_journals (id, subject_id, date, content) VALUES (?, ?, ?, ?)",
        )
        .run(
          ...sanitizeValues([
            journal.id,
            journal.subject_id,
            journal.date,
            journal.content,
          ]),
        ),

    update: (
      id: string,
      content: string, // ← nuevo
    ) =>
      db
        .prepare("UPDATE practice_journals SET content = ? WHERE id = ?")
        .run(content, id),

    delete: (
      id: string, // ← nuevo
    ) => db.prepare("DELETE FROM practice_journals WHERE id = ?").run(id),
  },

  // --- OWNERSHIP ---
  ownership: {
    subjectBelongsToUser: (subjectId: string, userId: string): boolean => {
      const row = db
        .prepare("SELECT id FROM subjects WHERE id = ? AND user_id = ?")
        .get(subjectId, userId);
      return !!row;
    },

    taskBelongsToUser: (taskId: string, userId: string): boolean => {
      const row = db
        .prepare(
          `
      SELECT t.id FROM tasks t
      JOIN subjects s ON t.subject_id = s.id
      WHERE t.id = ? AND s.user_id = ?
    `,
        )
        .get(taskId, userId);
      return !!row;
    },

    absenceBelongsToUser: (absenceId: string, userId: string): boolean => {
      const row = db
        .prepare(
          `
      SELECT a.id FROM absences a
      JOIN subjects s ON a.subject_id = s.id
      WHERE a.id = ? AND s.user_id = ?
    `,
        )
        .get(absenceId, userId);
      return !!row;
    },

    journalBelongsToUser: (journalId: string, userId: string): boolean => {
      const row = db
        .prepare(
          `
      SELECT j.id FROM practice_journals j
      JOIN subjects s ON j.subject_id = s.id
      WHERE j.id = ? AND s.user_id = ?
    `,
        )
        .get(journalId, userId);
      return !!row;
    },
  },
};
