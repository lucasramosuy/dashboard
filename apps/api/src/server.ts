import "./instrument";
import { runWeeklySummary } from "./services/weeklySummary";
import { dispatchCron, DASHBOARD_CRON_UTC } from "./cron-dispatch";
import cron from "node-cron";
import { app } from "./app";
import { initDB } from "./lib/db";
import { syncAllCalendars, runDailySummary } from "./cron";
import { logger } from "./lib/logger";

// Server de Bun para desarrollo local y tests. En producción la API corre en el Worker.
await initDB();

cron.schedule(DASHBOARD_CRON_UTC, () => {
  void dispatchCron(Date.now(), {
    ical: syncAllCalendars,
    daily: runDailySummary,
    weekly: runWeeklySummary,
  }).catch((err) => logger.error("[Cron] Falló la tarea programada", err));
}, { timezone: "Etc/UTC" });

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
