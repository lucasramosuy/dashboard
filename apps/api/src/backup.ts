// Exporta la base entera a un dump SQL (esquema + datos) por stdout.
// Uso: bun run backup > dump.sql   (con TURSO_DATABASE_URL/TURSO_AUTH_TOKEN apunta a producción)
// Lo usa el workflow semanal .github/workflows/backup.yml, que cifra el archivo antes de guardarlo.
import { createClient } from "@libsql/client";
import { getDbConfig } from "./lib/db";

const client = createClient(getDbConfig());

const quote = (v: unknown): string => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number" || typeof v === "bigint") return String(v);
  if (v instanceof ArrayBuffer) return `X'${Buffer.from(v).toString("hex")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

const tables = await client.execute(
  "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%' AND sql IS NOT NULL ORDER BY name",
);

const out: string[] = ["PRAGMA foreign_keys=OFF;", "BEGIN TRANSACTION;"];
let rows = 0;
for (const t of tables.rows) {
  const name = t.name as string;
  out.push(`DROP TABLE IF EXISTS "${name}";`, `${t.sql as string};`);
  const data = await client.execute(`SELECT * FROM "${name}"`);
  for (const row of data.rows) {
    const values = data.columns.map((c) => quote(row[c]));
    out.push(
      `INSERT INTO "${name}" (${data.columns.map((c) => `"${c}"`).join(", ")}) VALUES (${values.join(", ")});`,
    );
    rows++;
  }
}
const indexes = await client.execute(
  "SELECT sql FROM sqlite_master WHERE type = 'index' AND sql IS NOT NULL",
);
for (const i of indexes.rows) out.push(`${i.sql as string};`);
out.push("COMMIT;");

process.stdout.write(out.join("\n") + "\n");
console.error(`✅ ${tables.rows.length} tablas, ${rows} filas`);
process.exit(0);
