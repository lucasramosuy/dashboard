import cron from "node-cron";
import * as Sentry from "@sentry/bun";
import { db } from "./lib/db";
import { icalService } from "./services/icalService";
import { logger } from "./lib/logger";

// Sincroniza todos los días a las 00:00
export const initCronJobs = () => {
  cron.schedule("0 0 * * *", async () => {
    await Sentry.withMonitor(
      "ical-sync",
      async () => {
        logger.info("[Cron] Iniciando sincronización de iCal automática...");
        try {
          const rs = await db.execute(
            "SELECT id, ical_url FROM user WHERE ical_url IS NOT NULL AND ical_url != ''",
          );

          let successCount = 0;
          let errorCount = 0;

          for (const row of rs.rows) {
            try {
              await icalService.syncUserCalendar(row.id as string, row.ical_url as string);
              successCount++;
            } catch (err) {
              logger.error(err, `[Cron] Falló sincronización para usuario ${row.id}`);
              errorCount++;
            }
          }
          logger.info(
            `[Cron] Sincronización completada. Éxitos: ${successCount}, Errores: ${errorCount}`,
          );
        } catch (error) {
          logger.error(error, "[Cron] Error global en la tarea de mantenimiento de iCal:");
          throw error; // Re-throw para que withMonitor capture el fallo del check-in
        }
      },
      {
        schedule: {
          type: "crontab",
          value: "0 0 * * *",
        },
        timezone: "America/Montevideo",
      },
    );
  });
};
