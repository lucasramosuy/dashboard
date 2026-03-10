import { beforeAll, beforeEach } from "bun:test";
import { existsSync, mkdirSync, unlinkSync } from "fs";

// Force test environment BEFORE any module imports
Bun.env.NODE_ENV = "test";
// Clear Turso credentials so tests use local SQLite, not production DB
delete Bun.env.TURSO_DATABASE_URL;
delete Bun.env.TURSO_AUTH_TOKEN;
// Provide dummy auth credentials for better-auth
Bun.env.BETTER_AUTH_SECRET = "test-secret-key-that-is-at-least-32-chars-long";
Bun.env.BETTER_AUTH_URL = "http://localhost:8787";

// Ensure data directory exists and clean up old test DB
const testDbPath = "./data/test.sqlite";
mkdirSync("./data", { recursive: true });
if (existsSync(testDbPath)) {
  try {
    unlinkSync(testDbPath);
  } catch {
    /* file may not exist */
  }
}

// Now import DB module — it will see NODE_ENV=test and no TURSO_DATABASE_URL
const { initDB, db } = await import("../src/lib/db");

beforeAll(async () => {
  await initDB();
});

beforeEach(async () => {
  // Clean up data between tests
  const tables = [
    "absences",
    "tasks",
    "practice_journals",
    "subjects",
    "invites",
    "session",
    "account",
    "verification",
    "user",
  ];

  for (const table of tables) {
    try {
      await db.execute(`DELETE FROM ${table}`);
    } catch {
      /* table might not exist yet */
    }
  }
});
