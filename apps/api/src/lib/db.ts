import { createClient } from "@libsql/client";
import type { InValue } from "@libsql/client";
import { mkdirSync } from "fs";
import {
  UserPublic,
  Subject,
  Task,
  Absence,
  PracticeJournal,
  Invite,
} from "@dashboard/shared-types";

// --- DB CONFIG ---
const getDbConfig = () => {
  if (Bun.env.NODE_ENV === "test") {
    return { url: "file:./data/test.sqlite" };
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

// Ensure data directory exists before creating client
mkdirSync("./data", { recursive: true });
export const db = createClient(getDbConfig());

// --- INIT ---
export async function initDB() {
  await db.batch(
    [
      "PRAGMA foreign_keys = ON",
      `CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      emailVerified INTEGER NOT NULL,
      image TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      passwordHash TEXT,
      ical_url TEXT,
      last_ical_sync TEXT
    )`,
      `CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expiresAt TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      userId TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    )`,
      `CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      userId TEXT NOT NULL,
      accessToken TEXT,
      refreshToken TEXT,
      idToken TEXT,
      accessTokenExpiresAt TEXT,
      refreshTokenExpiresAt TEXT,
      scope TEXT,
      password TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    )`,
      `CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      createdAt TEXT,
      updatedAt TEXT
    )`,
      `CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      total_classes INTEGER DEFAULT 0,
      user_id TEXT NOT NULL,
      slug TEXT,
      track TEXT CHECK(track IN ('semestral', 'anual')),
      duration_weeks INTEGER,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
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
      subject_id TEXT,
      user_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT CHECK(status IN ('todo', 'in-progress', 'done')) DEFAULT 'todo',
      due_date TEXT NOT NULL,
      source TEXT DEFAULT 'manual',
      type TEXT CHECK(type IN ('parcial', 'examen', 'trabajo', 'otro')),
      grade REAL,
      file_url TEXT,
      comments TEXT,
      is_planner INTEGER DEFAULT 0,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )`,
      `CREATE TABLE IF NOT EXISTS practice_journals (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      user_id TEXT,
      date TEXT NOT NULL,
      content TEXT NOT NULL
    )`,
      `CREATE TABLE IF NOT EXISTS invites (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )`,
      `CREATE TABLE IF NOT EXISTS ical_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      url TEXT,
      start_date TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )`,
    ],
    "write",
  );

  // Intentar agregar columnas si ya existía la tabla y no las tiene
  try {
    await db.execute("ALTER TABLE user ADD COLUMN ical_url TEXT");
  } catch {
    /* ignored, column might already exist */
  }

  try {
    await db.execute("ALTER TABLE user ADD COLUMN last_ical_sync TEXT");
  } catch {
    /* ignored, column might already exist */
  }

  // Fase 9: nuevas columnas en subjects (track, duration_weeks) + slug
  for (const col of [
    "ALTER TABLE subjects ADD COLUMN track TEXT",
    "ALTER TABLE subjects ADD COLUMN duration_weeks INTEGER",
    "ALTER TABLE subjects ADD COLUMN slug TEXT",
  ]) {
    try {
      await db.execute(col);
    } catch {
      /* ya existe */
    }
  }

  // Fase 9: nuevas columnas en tasks + slug
  for (const col of [
    "ALTER TABLE tasks ADD COLUMN type TEXT",
    "ALTER TABLE tasks ADD COLUMN grade REAL",
    "ALTER TABLE tasks ADD COLUMN file_url TEXT",
    "ALTER TABLE tasks ADD COLUMN comments TEXT",
    "ALTER TABLE tasks ADD COLUMN slug TEXT",
  ]) {
    try {
      await db.execute(col);
    } catch {
      /* ya existe */
    }
  }

  try {
    await db.execute("ALTER TABLE tasks ADD COLUMN is_planner INTEGER DEFAULT 0");
  } catch {
    /* ya existe */
  }

  // Añadir user_id a practice_journals si no existe
  try {
    await db.execute("ALTER TABLE practice_journals ADD COLUMN user_id TEXT");
  } catch {
    /* ya existe */
  }

  // Migración: generar slugs para subjects que no tengan uno
  try {
    const rows = await db.execute("SELECT id, name FROM subjects WHERE slug IS NULL");
    for (const row of rows.rows) {
      const name = String(row.name ?? "");
      const slug = name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-");
      if (slug) {
        await db.execute({
          sql: "UPDATE subjects SET slug = ? WHERE id = ?",
          args: [slug, String(row.id)],
        });
        console.log(`[DB] Slug generado: "${slug}" para subject "${name}"`);
      }
    }
  } catch {
    /* ignore migration errors */
  }

  // Migración: generar slugs para tasks que no tengan uno
  try {
    const taskRows = await db.execute("SELECT id, title FROM tasks WHERE slug IS NULL");
    for (const row of taskRows.rows) {
      const title = String(row.title ?? "");
      const slug = title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-");
      if (slug) {
        await db.execute({
          sql: "UPDATE tasks SET slug = ? WHERE id = ?",
          args: [slug, String(row.id)],
        });
      }
    }
  } catch {
    /* ignore migration errors */
  }

  // Migración: popular user_id en tasks
  try {
    await db.execute(
      "UPDATE tasks SET user_id = (SELECT user_id FROM subjects WHERE subjects.id = tasks.subject_id) WHERE user_id IS NULL AND subject_id IS NOT NULL",
    );
  } catch {
    /* ignore migration errors */
  }

  // Migración: remover FOREIGN KEY de practice_journals
  try {
    const tableInfo = await db.execute("PRAGMA foreign_key_list(practice_journals)");
    if (tableInfo.rows.some((row) => row.table === "subjects")) {
      console.log("[DB] Removiendo FOREIGN KEY de practice_journals...");
      await db.execute("PRAGMA foreign_keys = OFF");
      await db.execute("BEGIN TRANSACTION");
      await db.execute("ALTER TABLE practice_journals RENAME TO practice_journals_old");
      await db.execute(`
        CREATE TABLE IF NOT EXISTS practice_journals (
          id TEXT PRIMARY KEY,
          subject_id TEXT NOT NULL,
          user_id TEXT,
          date TEXT NOT NULL,
          content TEXT NOT NULL
        )
      `);
      await db.execute(
        "INSERT INTO practice_journals (id, subject_id, user_id, date, content) SELECT id, subject_id, user_id, date, content FROM practice_journals_old",
      );
      await db.execute("DROP TABLE practice_journals_old");
      await db.execute("COMMIT");
      await db.execute("PRAGMA foreign_keys = ON");
      console.log("[DB] Migración de practice_journals (sin FK) completada.");
    }
  } catch (error) {
    console.error("[DB] Error migrando practice_journals:", error);
    try {
      await db.execute("ROLLBACK");
      await db.execute("PRAGMA foreign_keys = ON");
    } catch {
      // Ignore
    }
  }

  // Migración de datos: Fix de user_id NULL y duplicados en practice_journals
  try {
    await db.execute(
      "UPDATE practice_journals SET user_id = (SELECT id FROM user LIMIT 1) WHERE user_id IS NULL",
    );

    // Opcional: Borrar si hay muchísimos duplicados por bugs previos.
    // Usamos la primary key (id) dado que ROWID puede ser problemático en algunas apps de bun:sqlite con tablas string.
    await db.execute(`
      DELETE FROM practice_journals
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY date, subject_id, user_id ORDER BY id DESC) as rn
          FROM practice_journals
        ) WHERE rn = 1
      )
    `);
  } catch (err) {
    console.error("[DB] Error arreglando datos en practice_journals:", err);
  }

  const config = getDbConfig();
  const location = config.url.startsWith("file::memory:")
    ? "in-memory (test)"
    : (Bun.env.TURSO_DATABASE_URL ?? "local file");
  console.log(`[DB] Database initialized: ${location}`);
}

// --- HELPERS ---

// Extrae solo las propiedades nombradas de una Row de libsql
// (evita las claves numéricas del array subyacente)
function toObj<T>(row: Record<string, unknown>): T {
  if (!row) return row as T;
  const obj: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    if (isNaN(Number(key))) obj[key] = row[key];
  }
  return obj as T;
}

function toDate<T>(row: Record<string, unknown>): T {
  if (!row) return row as T;
  const target = toObj<Record<string, unknown>>(row);
  if (target.date) target.date = new Date(target.date as string);
  if (target.due_date) target.due_date = new Date(target.due_date as string);
  return target as T;
}

function sanitizeValues(values: unknown[]): InValue[] {
  return values.map((v) => {
    if (v instanceof Date) return v.toISOString();
    if (v === undefined) return null;
    return v as InValue;
  });
}

// --- SERVICE ---
export const dbService = {
  run: async (sql: string, params: unknown[] = []) => {
    return db.execute({ sql, args: sanitizeValues(params) });
  },

  // --- USERS ---
  users: {
    getByEmail: async (email: string): Promise<UserPublic | null> => {
      const r = await db.execute({
        sql: "SELECT * FROM user WHERE email = ?",
        args: [email],
      });
      return r.rows[0] ? toObj<UserPublic>(r.rows[0]) : null;
    },

    getById: async (id: string): Promise<UserPublic | null> => {
      const r = await db.execute({
        sql: "SELECT * FROM user WHERE id = ?",
        args: [id],
      });
      return r.rows[0] ? toObj<UserPublic>(r.rows[0]) : null;
    },

    create: async (user: {
      id: string;
      name: string;
      email: string;
      emailVerified?: boolean;
      image?: string | null;
      createdAt?: Date;
      updatedAt?: Date;
      role?: string;
      passwordHash?: string | null;
    }) => {
      return db.execute({
        sql: "INSERT INTO user (id, name, email, emailVerified, image, createdAt, updatedAt, role, passwordHash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: sanitizeValues([
          user.id,
          user.name,
          user.email,
          user.emailVerified ? 1 : 0,
          user.image || null,
          user.createdAt || new Date(),
          user.updatedAt || new Date(),
          user.role || "user",
          user.passwordHash || null,
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

    getById: async (idOrSlug: string): Promise<Subject | null> => {
      const r = await db.execute({
        sql: "SELECT * FROM subjects WHERE id = ? OR slug = ?",
        args: [idOrSlug, idOrSlug],
      });
      return r.rows[0] ? toObj<Subject>(r.rows[0]) : null;
    },

    create: async (subject: Subject) => {
      return db.execute({
        sql: "INSERT INTO subjects (id, name, total_classes, user_id, slug, track, duration_weeks) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: sanitizeValues([
          subject.id,
          subject.name,
          subject.total_classes,
          subject.user_id,
          subject.slug || null,
          subject.track || null,
          subject.duration_weeks || null,
        ]),
      });
    },

    update: async (idOrSlug: string, data: Partial<Subject>) => {
      const sets = Object.keys(data)
        .map((k) => `${k} = ?`)
        .join(", ");
      const values = [...Object.values(data), idOrSlug, idOrSlug];
      return db.execute({
        sql: `UPDATE subjects SET ${sets} WHERE id = ? OR slug = ?`,
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
        sql: "SELECT * FROM tasks WHERE subject_id = ? AND is_planner = 0",
        args: [subjectId],
      });
      return r.rows.map(toDate<Task>);
    },

    getByUser: async (userId: string, includePlanner = false): Promise<Task[]> => {
      // Usamos un LEFT JOIN con subjects para encontrar tareas que no tengan user_id directo
      // pero que pertenezcan a una materia del usuario.
      const sql = includePlanner
        ? `SELECT DISTINCT t.* FROM tasks t
           LEFT JOIN subjects s ON t.subject_id = s.id
           WHERE (t.user_id = ? OR s.user_id = ?)`
        : `SELECT DISTINCT t.* FROM tasks t
           LEFT JOIN subjects s ON t.subject_id = s.id
           WHERE (t.user_id = ? OR s.user_id = ?) AND t.is_planner = 0`;

      const r = await db.execute({
        sql,
        args: includePlanner ? [userId, userId] : [userId, userId],
      });
      return r.rows.map(toDate<Task>);
    },

    getById: async (idOrSlug: string): Promise<Task | null> => {
      const r = await db.execute({
        sql: "SELECT * FROM tasks WHERE id = ? OR slug = ?",
        args: [idOrSlug, idOrSlug],
      });
      return r.rows[0] ? toDate<Task>(r.rows[0]) : null;
    },

    create: async (task: Task) => {
      return db.execute({
        sql: "INSERT INTO tasks (id, subject_id, user_id, title, description, status, due_date, slug, type, grade, file_url, comments, is_planner) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: sanitizeValues([
          task.id,
          task.subject_id,
          task.user_id,
          task.title,
          task.description,
          task.status,
          task.due_date,
          task.slug || null,
          task.type || null,
          task.grade ?? null,
          task.file_url || null,
          task.comments || null,
          task.is_planner ? 1 : 0,
        ]),
      });
    },

    update: async (idOrSlug: string, data: Partial<Task>) => {
      const sets = Object.keys(data)
        .map((k) => `${k} = ?`)
        .join(", ");
      const values = [...Object.values(data), idOrSlug, idOrSlug];
      return db.execute({
        sql: `UPDATE tasks SET ${sets} WHERE id = ? OR slug = ?`,
        args: sanitizeValues(values),
      });
    },

    updateStatus: async (idOrSlug: string, status: string) => {
      return db.execute({
        sql: "UPDATE tasks SET status = ? WHERE id = ? OR slug = ?",
        args: [status, idOrSlug, idOrSlug],
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
        sql: "SELECT * FROM practice_journals WHERE user_id = ? ORDER BY date DESC",
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
        sql: "INSERT INTO practice_journals (id, subject_id, user_id, date, content) VALUES (?, ?, ?, ?, ?)",
        args: sanitizeValues([
          journal.id,
          journal.subject_id,
          journal.user_id,
          journal.date,
          journal.content,
        ]),
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
    subjectBelongsToUser: async (subjectIdOrSlug: string, userId: string): Promise<boolean> => {
      const r = await db.execute({
        sql: "SELECT id FROM subjects WHERE (id = ? OR slug = ?) AND user_id = ?",
        args: [subjectIdOrSlug, subjectIdOrSlug, userId],
      });
      return r.rows.length > 0;
    },

    taskBelongsToUser: async (taskIdOrSlug: string, userId: string): Promise<boolean> => {
      const r = await db.execute({
        sql: `SELECT id FROM tasks WHERE (id = ? OR slug = ?) AND user_id = ?`,
        args: [taskIdOrSlug, taskIdOrSlug, userId],
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
        sql: "SELECT id FROM practice_journals WHERE id = ? AND user_id = ?",
        args: [journalId, userId],
      });
      return r.rows.length > 0;
    },
  },

  // --- INVITES ---
  invites: {
    create: async (invite: Invite) => {
      return db.execute({
        sql: "INSERT INTO invites (id, code, used, created_at) VALUES (?, ?, ?, ?)",
        args: sanitizeValues([invite.id, invite.code, invite.used ? 1 : 0, invite.created_at]),
      });
    },

    getByCode: async (code: string): Promise<Invite | null> => {
      const r = await db.execute({
        sql: "SELECT * FROM invites WHERE code = ?",
        args: [code],
      });
      if (!r.rows[0]) return null;
      const res = toObj<Record<string, unknown>>(r.rows[0]);
      return {
        id: res.id as string,
        code: res.code as string,
        used: res.used === 1,
        created_at: new Date(res.created_at as string),
      } as Invite;
    },

    markUsed: async (id: string) => {
      return db.execute({
        sql: "UPDATE invites SET used = 1 WHERE id = ?",
        args: [id],
      });
    },

    countActive: async (): Promise<number> => {
      const r = await db.execute({
        sql: "SELECT COUNT(*) as count FROM invites WHERE used = 0",
        args: [],
      });
      return Number(r.rows[0].count);
    },
  },

  // --- ICAL EVENTS ---
  icalEvents: {
    getByUser: async (userId: string): Promise<any[]> => {
      const r = await db.execute({
        sql: "SELECT * FROM ical_events WHERE user_id = ? ORDER BY start_date ASC",
        args: [userId],
      });
      return r.rows.map(toDate<any>);
    },

    deleteByUser: async (userId: string) => {
      return db.execute({
        sql: "DELETE FROM ical_events WHERE user_id = ?",
        args: [userId],
      });
    },

    insertBatch: async (events: any[]) => {
      if (events.length === 0) return;
      const statements = events.map((e) => ({
        sql: "INSERT INTO ical_events (id, user_id, title, description, url, start_date) VALUES (?, ?, ?, ?, ?, ?)",
        args: sanitizeValues([e.id, e.user_id, e.title, e.description, e.url, e.start_date]),
      }));
      await db.batch(statements, "write");
    },
  },
};
