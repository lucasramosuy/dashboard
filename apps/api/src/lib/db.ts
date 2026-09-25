import { createClient } from "@libsql/client";
import type { InValue } from "@libsql/client";
import {
  UserPublic,
  Subject,
  Task,
  Absence,
  PracticeJournal,
  Invite,
  IcalEvent,
} from "@dashboard/shared-types";
import { logger } from "./logger";

// Column whitelists for dynamic UPDATE queries (SEC-1)
const SUBJECT_COLUMNS = new Set<string>([
  "name",
  "total_classes",
  "slug",
  "track",
  "duration_weeks",
]);
const TASK_COLUMNS = new Set<string>([
  "title",
  "description",
  "status",
  "due_date",
  "slug",
  "type",
  "grade",
  "file_url",
  "comments",
  "is_planner",
]);

// --- DB CONFIG ---
export const getDbConfig = () => {
  if (process.env.NODE_ENV === "test") {
    return { url: "file:./data/test.sqlite" };
  }
  if (process.env.TURSO_DATABASE_URL) {
    return {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN ?? "",
    };
  }
  // Worker sin Turso configurado (dev con API_PROXY_URL): la API real corre en Bun,
  // pero el módulo se importa igual. libsql web no acepta file:, así que se apunta a
  // un sqld local (`turso dev`), que solo se usa si alguien consulta la base.
  if (typeof globalThis.Bun === "undefined") {
    return { url: "http://127.0.0.1:8080" };
  }
  // dev fallback — archivo local, igual que antes
  const dbPath = process.env.DATABASE_PATH ?? "./data/database.sqlite";
  return { url: `file:${dbPath}` };
};

// Con SQLite local (dev/tests en Bun) la carpeta data/ tiene que existir.
// En Workers siempre se usa Turso, así que no se toca el filesystem.
const dbConfig = getDbConfig();
if (dbConfig.url.startsWith("file:")) {
  const { mkdirSync } = await import("node:fs");
  mkdirSync("./data", { recursive: true });
}
export const db = createClient(dbConfig);

// Helper: check if a column exists in a table (ARCH-1/ERR-1)
async function columnExists(table: string, column: string): Promise<boolean> {
  const r = await db.execute(`PRAGMA table_info(${table})`);
  return r.rows.some((row) => row.name === column);
}

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
      `CREATE TABLE IF NOT EXISTS passkey (
      id TEXT PRIMARY KEY,
      name TEXT,
      publicKey TEXT NOT NULL,
      userId TEXT NOT NULL,
      credentialID TEXT NOT NULL,
      counter INTEGER NOT NULL,
      deviceType TEXT NOT NULL,
      backedUp INTEGER NOT NULL,
      transports TEXT,
      createdAt TEXT,
      aaguid TEXT,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    )`,
      "CREATE INDEX IF NOT EXISTS idx_passkey_user ON passkey(userId)",
      "CREATE INDEX IF NOT EXISTS idx_passkey_credential ON passkey(credentialID)",
      `CREATE TABLE IF NOT EXISTS rateLimit (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      count INTEGER NOT NULL,
      lastRequest INTEGER NOT NULL
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

  // Migrations: add columns if they don't already exist (ARCH-1/ERR-1)
  if (!(await columnExists("user", "ical_url"))) {
    await db.execute("ALTER TABLE user ADD COLUMN ical_url TEXT");
  }
  if (!(await columnExists("user", "last_ical_sync"))) {
    await db.execute("ALTER TABLE user ADD COLUMN last_ical_sync TEXT");
  }
  // Cuándo se inició la sesión con passkey (panel de admin, ver lib/admin-passkey.ts)
  if (!(await columnExists("session", "passkey_at"))) {
    await db.execute("ALTER TABLE session ADD COLUMN passkey_at TEXT");
  }

  // Fase 9: nuevas columnas en subjects (track, duration_weeks) + slug
  const subjectMigrations: [string, string][] = [
    ["subjects", "track"],
    ["subjects", "duration_weeks"],
    ["subjects", "slug"],
  ];
  for (const [table, col] of subjectMigrations) {
    if (!(await columnExists(table, col))) {
      await db.execute(
        `ALTER TABLE ${table} ADD COLUMN ${col} ${col === "duration_weeks" ? "INTEGER" : "TEXT"}`,
      );
    }
  }

  // Fase 9: nuevas columnas en tasks + slug
  const taskMigrations: [string, string, string][] = [
    ["tasks", "type", "TEXT"],
    ["tasks", "grade", "REAL"],
    ["tasks", "file_url", "TEXT"],
    ["tasks", "comments", "TEXT"],
    ["tasks", "slug", "TEXT"],
  ];
  for (const [table, col, colType] of taskMigrations) {
    if (!(await columnExists(table, col))) {
      await db.execute(`ALTER TABLE ${table} ADD COLUMN ${col} ${colType}`);
    }
  }

  if (!(await columnExists("tasks", "is_planner"))) {
    await db.execute("ALTER TABLE tasks ADD COLUMN is_planner INTEGER DEFAULT 0");
  }

  // Añadir user_id a practice_journals si no existe
  if (!(await columnExists("practice_journals", "user_id"))) {
    await db.execute("ALTER TABLE practice_journals ADD COLUMN user_id TEXT");
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
        logger.info(`[DB] Slug generado: "${slug}" para subject "${name}"`);
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
      logger.info("[DB] Removiendo FOREIGN KEY de practice_journals...");
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
      logger.info("[DB] Migración de practice_journals (sin FK) completada.");
    }
  } catch (error) {
    logger.error("[DB] Error migrando practice_journals:", error);
    try {
      await db.execute("ROLLBACK");
      await db.execute("PRAGMA foreign_keys = ON");
    } catch {
      // Ignore
    }
  }

  // Migración de datos: Fix de user_id NULL y duplicados en practice_journals
  // BUG-3: This assigns orphaned journals to the first user — acceptable for single-user
  // deployments but may misattribute data in multi-user setups.
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
    logger.error("[DB] Error arreglando datos en practice_journals:", err);
  }

  const config = getDbConfig();
  const location = config.url.startsWith("file::memory:")
    ? "in-memory (test)"
    : (process.env.TURSO_DATABASE_URL ?? "local file");
  logger.info(`[DB] Database initialized: ${location}`);
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

// Filter keys through a column whitelist to prevent SQL injection (SEC-1)
function filterColumns(
  data: Record<string, unknown>,
  allowed: Set<string>,
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const key of Object.keys(data)) {
    if (allowed.has(key)) filtered[key] = data[key];
  }
  return filtered;
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
      const safe = filterColumns(data as Record<string, unknown>, SUBJECT_COLUMNS);
      const keys = Object.keys(safe);
      if (keys.length === 0) return;
      const sets = keys.map((k) => `${k} = ?`).join(", ");
      const values = [...Object.values(safe), idOrSlug, idOrSlug];
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

    // PERF-1: fetch tasks within a date range instead of all tasks
    getByUserAndDateRange: async (
      userId: string,
      startDate: string,
      endDate: string,
      includePlanner = false,
    ): Promise<Task[]> => {
      const sql = includePlanner
        ? `SELECT DISTINCT t.* FROM tasks t
           LEFT JOIN subjects s ON t.subject_id = s.id
           WHERE (t.user_id = ? OR s.user_id = ?) AND t.due_date >= ? AND t.due_date <= ?`
        : `SELECT DISTINCT t.* FROM tasks t
           LEFT JOIN subjects s ON t.subject_id = s.id
           WHERE (t.user_id = ? OR s.user_id = ?) AND t.is_planner = 0 AND t.due_date >= ? AND t.due_date <= ?`;

      const r = await db.execute({
        sql,
        args: [userId, userId, startDate, endDate],
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
      const safe = filterColumns(data as Record<string, unknown>, TASK_COLUMNS);
      const keys = Object.keys(safe);
      if (keys.length === 0) return;
      const sets = keys.map((k) => `${k} = ?`).join(", ");
      const values = [...Object.values(safe), idOrSlug, idOrSlug];
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

    // PERF-2: fetch journals by specific date
    getByDate: async (userId: string, date: string): Promise<PracticeJournal[]> => {
      const r = await db.execute({
        // date se guarda como ISO (YYYY-MM-DDT00:00:00.000Z): comparamos solo el día
        sql: "SELECT * FROM practice_journals WHERE user_id = ? AND substr(date, 1, 10) = ? ORDER BY date DESC",
        args: [userId, date],
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
    getByUser: async (userId: string): Promise<IcalEvent[]> => {
      const r = await db.execute({
        sql: "SELECT * FROM ical_events WHERE user_id = ? ORDER BY start_date ASC",
        args: [userId],
      });
      return r.rows.map(toDate<IcalEvent>);
    },

    deleteByUser: async (userId: string) => {
      return db.execute({
        sql: "DELETE FROM ical_events WHERE user_id = ?",
        args: [userId],
      });
    },

    insertBatch: async (events: IcalEvent[]) => {
      if (events.length === 0) return;
      const statements = events.map((e) => ({
        sql: "INSERT INTO ical_events (id, user_id, title, description, url, start_date) VALUES (?, ?, ?, ?, ?, ?)",
        args: sanitizeValues([e.id, e.user_id, e.title, e.description, e.url, e.start_date]),
      }));
      await db.batch(statements, "write");
    },

    // ARCH-8: Atomic delete-then-insert for iCal sync
    replaceByUser: async (userId: string, events: IcalEvent[]) => {
      const deleteStmt = {
        sql: "DELETE FROM ical_events WHERE user_id = ?",
        args: [userId] as InValue[],
      };
      const insertStmts = events.map((e) => ({
        sql: "INSERT INTO ical_events (id, user_id, title, description, url, start_date) VALUES (?, ?, ?, ?, ?, ?)",
        args: sanitizeValues([e.id, e.user_id, e.title, e.description, e.url, e.start_date]),
      }));
      await db.batch([deleteStmt, ...insertStmts], "write");
    },
  },
};
