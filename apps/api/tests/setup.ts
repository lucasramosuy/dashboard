import { beforeAll, beforeEach } from "bun:test";
import { initDB, db } from "../src/lib/db";

// Force test environment
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.DEV_LOGIN_ENABLED = "true";

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
