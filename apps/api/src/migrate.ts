// Crea/actualiza las tablas (CREATE TABLE IF NOT EXISTS + columnas nuevas).
// Lo corre el workflow de deploy contra Turso antes de publicar el Worker.
import { initDB } from "./lib/db";

await initDB();
console.log("✅ Base de datos al día");
process.exit(0);
