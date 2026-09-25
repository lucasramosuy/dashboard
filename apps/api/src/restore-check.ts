// Prueba de restore: carga un dump de `bun run backup` (ya descifrado) en una base
// SQLite temporal y verifica que quedó completa y usable. No toca Turso.
// Uso: bun run restore-check dump.sql
// Lo usa el workflow mensual .github/workflows/restore-test.yml. El repo es público:
// solo imprime cantidades, nunca datos.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";

const file = process.argv[2];
if (!file) {
  console.error("Uso: bun run restore-check <dump.sql>");
  process.exit(1);
}

// Tablas sin las cuales la app no funciona
const REQUIRED = ["user", "session", "account", "subjects", "tasks", "invites"];

const sql = await Bun.file(file).text();
const expectedTables = (sql.match(/^CREATE TABLE /gm) ?? []).length;
const expectedRows = (sql.match(/^INSERT INTO /gm) ?? []).length;

const dir = mkdtempSync(join(tmpdir(), "restore-check-"));
const url = `file:${join(dir, "restore.sqlite")}`;
const fail = (msg: string): never => {
  console.error(`❌ ${msg}`);
  rmSync(dir, { recursive: true, force: true });
  process.exit(1);
};

try {
  const client = createClient({ url });
  await client.executeMultiple(sql);

  const integrity = await client.execute("PRAGMA integrity_check");
  if (String(integrity.rows[0]?.[0]) !== "ok") fail("integrity_check no dio ok");

  const tables = (
    await client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
    )
  ).rows.map((r) => String(r.name));
  if (tables.length !== expectedTables)
    fail(`se esperaban ${expectedTables} tablas y hay ${tables.length}`);
  const missing = REQUIRED.filter((t) => !tables.includes(t));
  if (missing.length) fail(`faltan tablas: ${missing.join(", ")}`);

  let rows = 0;
  for (const t of tables) {
    const r = await client.execute(`SELECT COUNT(*) AS n FROM "${t}"`);
    rows += Number(r.rows[0]?.n ?? 0);
  }
  if (rows !== expectedRows) fail(`se esperaban ${expectedRows} filas y hay ${rows}`);

  const users = await client.execute('SELECT COUNT(*) AS n FROM "user"');
  if (Number(users.rows[0]?.n ?? 0) === 0) fail("la tabla user está vacía");
  client.close();

  // La app tiene que poder arrancar sobre la base restaurada (mismas migraciones del deploy)
  process.env.TURSO_DATABASE_URL = url;
  delete process.env.TURSO_AUTH_TOKEN;
  const { initDB } = await import("./lib/db");
  await initDB();

  console.log(`✅ Restore OK: ${tables.length} tablas, ${rows} filas, migraciones al día`);
} catch (err) {
  fail(`el restore falló: ${err instanceof Error ? err.message : String(err)}`);
}
rmSync(dir, { recursive: true, force: true });
process.exit(0);
