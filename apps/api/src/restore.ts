// Restaura un dump de `bun run backup` (ya descifrado) sobre la base configurada.
// Uso: bun run restore dump.sql   (con TURSO_* apunta a producción: REEMPLAZA las tablas)
import { createClient } from "@libsql/client";
import { getDbConfig } from "./lib/db";

const file = process.argv[2];
if (!file) {
  console.error("Uso: bun run restore <dump.sql>");
  process.exit(1);
}
const answer = prompt(
  `Esto reemplaza las tablas de ${process.env.TURSO_DATABASE_URL ?? "la base local"}. Escribí "restaurar" para seguir:`,
);
if (answer !== "restaurar") {
  console.error("Cancelado.");
  process.exit(1);
}
const sql = await Bun.file(file).text();
const client = createClient(getDbConfig());
await client.executeMultiple(sql);
console.log("✅ Base restaurada");
process.exit(0);
