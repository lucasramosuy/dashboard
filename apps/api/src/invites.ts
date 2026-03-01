import { initDB, dbService } from "./lib/db";
import { randomUUID } from "crypto";

async function main() {
  await initDB();

  const LIMIT = 10;
  const activeCount = await dbService.invites.countActive();

  if (activeCount >= LIMIT) {
    console.log(`⚠️ Ya hay ${activeCount} activos. Límite: ${LIMIT}.`);
    process.exit(0);
  }

  const toCreate = Math.min(3, LIMIT - activeCount);
  let created = 0;

  while (created < toCreate) {
    // Generar código corto
    const code = randomUUID().split("-")[0].toUpperCase();
    const invite = {
      id: randomUUID(),
      code,
      used: false,
      created_at: new Date(),
    };

    try {
      await dbService.invites.create(invite);
      console.log(`✅ Creado: ${code}`);
      created++;
    } catch (err: any) {
      // Si el error es por el UNIQUE constraint (SQLITE_CONSTRAINT_UNIQUE o similar en LibSQL)
      if (err.message?.includes("UNIQUE constraint failed")) {
        console.warn(`[Colisión] El código ${code} ya existe. Reintentando...`);
        continue; // No incrementamos 'created', el bucle vuelve a intentar
      }
      throw err; // Si es otro error (ej. conexión), abortamos
    }
  }
  process.exit(0);
}

// para que no salte error del linter de que main no se esta usando, uso la solución abajo.
main()
  .then(() => {
    console.log("🚀 Proceso de invitaciones finalizado con éxito.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error crítico en el script de invitaciones:", err);
    process.exit(1);
  });
