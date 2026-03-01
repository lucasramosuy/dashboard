import { beforeAll, beforeEach } from "bun:test";
import { initDB, db } from "../src/lib/db";

// Force test environment
Bun.env.NODE_ENV = "test";
Bun.env.JWT_SECRET = "test-secret";
Bun.env.DEV_LOGIN_ENABLED = "true";

beforeAll(async () => {
  // Initial table creation
  await initDB();
});

beforeEach(async () => {
  // Clean up all tables before each test to ensure isolation
  // Note: order matters for foreign key constraints
  await db.batch(
    [
      "DELETE FROM absences",
      "DELETE FROM tasks",
      "DELETE FROM practice_journals",
      "DELETE FROM subjects",
      "DELETE FROM invites",
      "DELETE FROM users",
    ],
    "write",
  );
});
