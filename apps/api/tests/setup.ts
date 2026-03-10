import { beforeAll, beforeEach } from "bun:test";
import { existsSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";

Bun.env.NODE_ENV = "test";
delete Bun.env.TURSO_DATABASE_URL;
delete Bun.env.TURSO_AUTH_TOKEN;

const testDbPath = "test.sqlite";

if (existsSync(testDbPath)) {
  try {
    unlinkSync(testDbPath);
  } catch {
    /* ignorar */
  }
}

const { initDB, db } = await import("../src/lib/db");

beforeAll(async () => {
  await initDB();

  try {
    // Corrección: Proveer la ruta exacta mediante el flag --config
    execSync("bunx @better-auth/cli migrate --config src/lib/auth.better.ts", {
      env: { ...process.env, NODE_ENV: "test" },
      stdio: "inherit",
    });
  } catch (error) {
    console.error("Fallo crítico al inicializar el esquema de Better Auth:", error);
    process.exit(1);
  }
});

beforeEach(async () => {
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
      /* tabla puede no existir aún */
    }
  }
});
