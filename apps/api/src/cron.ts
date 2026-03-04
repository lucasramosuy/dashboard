import cron from "node-cron";
import { db } from "./lib/db";
import { icalService } from "./services/icalService";

// Sincroniza todos los días a las 00:00
export const initCronJobs = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("[Cron] Iniciando sincronización de iCal automática...");
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
          console.error(`[Cron] Falló sincronización para usuario ${row.id}`, err);
          errorCount++;
        }
      }
      console.log(
        `[Cron] Sincronización completada. Éxitos: ${successCount}, Errores: ${errorCount}`,
      );
    } catch (error) {
      console.error("[Cron] Error global en la tarea de mantenimiento de iCal:", error);
    }
  });
};
