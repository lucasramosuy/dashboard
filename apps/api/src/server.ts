import "./instrument";
import cron from "node-cron";
import { app } from "./app";
import { initDB } from "./lib/db";
import { syncAllCalendars, ICAL_CRON_UTC } from "./cron";
import { logger } from "./lib/logger";

// Server de Bun para desarrollo local y tests. En producción la API corre en el Worker.
await initDB();

cron.schedule(ICAL_CRON_UTC, () => void syncAllCalendars(), { timezone: "Etc/UTC" });

export { app };

const port = process.env.PORT || 8787;

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

// ✅ Graceful shutdown para evitar puertos ocupados (EADDRINUSE) en Windows
const shutdown = (signal: string) => {
  logger.warn(`\n[${signal}] Cerrando servidor Bun y liberando el puerto ${server.port}...`);
  server.stop(true); // Detiene conexiones activas y libera el puerto
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
