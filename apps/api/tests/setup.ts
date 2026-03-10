import { beforeAll, beforeEach } from "bun:test";
import { existsSync, unlinkSync } from "node:fs";

// 1. Configurar entorno y limpiar variables de producción
Bun.env.NODE_ENV = "test";
delete Bun.env.TURSO_DATABASE_URL;
delete Bun.env.TURSO_AUTH_TOKEN;

const testDbPath = "test.sqlite";

// 2. Eliminar la base de datos de prueba anterior si existe
if (existsSync(testDbPath)) {
  try {
    unlinkSync(testDbPath);
  } catch {
    console.warn("No se pudo eliminar la base de datos de prueba anterior.");
  }
}

const { initDB, db } = await import("../src/lib/db");

beforeAll(async () => {
  // 3. Como initDB() ya crea las tablas user, session, account y verification,
  // ¡ya no necesitamos ejecutar el comando lento de better-auth migrate!
  await initDB();
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

  // 4. Limpiar las tablas de forma segura
  try {
    await db.execute("PRAGMA foreign_keys = OFF;");

    for (const table of tables) {
      try {
        await db.execute(`DELETE FROM ${table}`);
      } catch {
        // Ignorar si la tabla no existe
      }
    }
  } finally {
    await db.execute("PRAGMA foreign_keys = ON;");
  }
});
