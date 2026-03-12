import cron from "node-cron";
import pLimit from "p-limit";
import * as Sentry from "@sentry/bun";
import { db } from "./lib/db";
import { icalService } from "./services/icalService";
import { logger } from "./lib/logger";

export const initCronJobs = () => {
  cron.schedule(
    "0 0 * * *",
    async () => {
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

            const limit = pLimit(10);

            const syncPromises = rs.rows.map((row) =>
              limit(async () => {
                try {
                  await icalService.syncUserCalendar(row.id as string, row.ical_url as string);
                  successCount++;
                } catch (err) {
                  // logger.error maneja automáticamente el envío a Sentry en producción.
                  logger.error(`[Cron] Falló sincronización para usuario ${row.id}`, err);
                  errorCount++;
                }
              }),
            );

            await Promise.allSettled(syncPromises);

            logger.info(
              `[Cron] Sincronización completada. Éxitos: ${successCount}, Errores: ${errorCount}`,
            );
          } catch (error) {
            logger.error("[Cron] Error global en la tarea de mantenimiento de iCal:", error);
            throw error;
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
    },
    {
      // Requerido por node-cron para ejecutar a la hora correcta
      timezone: "America/Montevideo",
    },
  );
};
