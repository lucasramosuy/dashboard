import cron from "node-cron";
import * as Sentry from "@sentry/bun";
import { db } from "./lib/db";
import { icalService } from "./services/icalService";

// Sincroniza todos los días a las 00:00
export const initCronJobs = () => {
  cron.schedule("0 0 * * *", async () => {
    await Sentry.withMonitor(
      "ical-sync",
      async () => {
        console.log("[Cron] Iniciando sincronización de iCal automática...");
        try {
          const rs = await db.execute(
            "SELECT id, ical_url FROM user WHERE ical_url IS NOT NULL AND ical_url != ''",
          );

          let successCount = 0;
          let errorCount = 0;

          const syncPromises = rs.rows.map(async (row) => {
            try {
              await icalService.syncUserCalendar(row.id as string, row.ical_url as string);
              successCount++;
            } catch (err) {
              console.error(`[Cron] Falló sincronización para usuario ${row.id}`, err);
              // Reportamos el error individual a Sentry
              Sentry.captureException(err);
              errorCount++;
            }
          });

          await Promise.allSettled(syncPromises);

          console.log(
            `[Cron] Sincronización completada. Éxitos: ${successCount}, Errores: ${errorCount}`,
          );
        } catch (error) {
          console.error("[Cron] Error global en la tarea de mantenimiento de iCal:", error);
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
