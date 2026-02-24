import { beforeAll, beforeEach } from "bun:test";
import { initDB, db } from "../src/lib/db";

// Force test environment
Bun.env.NODE_ENV = "test";
Bun.env.JWT_SECRET = "test-secret";
Bun.env.DEV_LOGIN_ENABLED = "true";

beforeAll(() => {
  // Initial table creation
  initDB();
});

beforeEach(() => {
  // Clean up all tables before each test to ensure isolation
  db.transaction(() => {
    // Note: order matters for foreign key constraints
    db.run("DELETE FROM absences");
    db.run("DELETE FROM tasks");
    db.run("DELETE FROM practice_journals");
    db.run("DELETE FROM subjects");
    db.run("DELETE FROM users");
  })();
});
