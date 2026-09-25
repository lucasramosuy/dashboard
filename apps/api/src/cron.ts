import * as Sentry from "@sentry/core";
import { db } from "./lib/db";
import { icalService } from "./services/icalService";
import { logger } from "./lib/logger";
import { notifyNewEvents, sendDailySummary } from "./services/notifyService";

// Sincronización diaria de iCal a las 00:00 de Montevideo (03:00 UTC).
// En Workers la dispara un Cron Trigger (wrangler.jsonc); en Bun, node-cron (server.ts).
export const ICAL_CRON_UTC = "0 3 * * *";
// Resumen diario por Telegram a las 07:00 de Montevideo (10:00 UTC)
export const SUMMARY_CRON_UTC = "0 10 * * *";

export async function syncAllCalendars() {
  await Sentry.withMonitor(
    "ical-sync",
    async () => {
      logger.info("[Cron] Iniciando sincronización de iCal automática...");
      const rs = await db.execute(
        "SELECT id, ical_url FROM user WHERE ical_url IS NOT NULL AND ical_url != ''",
      );

      let successCount = 0;
      let errorCount = 0;

      // De a un usuario por vez: el parseo es CPU y en Workers free hay 10 ms por invocación.
      // La espera de red (fetch del feed, Turso) no cuenta como CPU.
      for (const row of rs.rows) {
        try {
          const result = await icalService.syncUserCalendar(
            row.id as string,
            row.ical_url as string,
          );
          successCount++;
          try {
            await notifyNewEvents(row.id as string, result.newEvents);
          } catch (err) {
            logger.error("[Cron] Falló el aviso de Telegram", err);
          }
        } catch (err) {
          logger.error(`[Cron] Falló sincronización para usuario ${row.id}`, err);
          errorCount++;
        }
      }

      logger.info(
        `[Cron] Sincronización completada. Éxitos: ${successCount}, Errores: ${errorCount}`,
      );
    },
    { schedule: { type: "crontab", value: ICAL_CRON_UTC }, timezone: "Etc/UTC" },
  );
}

export async function runDailySummary() {
  await Sentry.withMonitor(
    "daily-summary",
    async () => {
      try {
        await sendDailySummary();
      } catch (err) {
        logger.error("[Cron] Falló el resumen diario de Telegram", err);
        throw err;
      }
    },
    { schedule: { type: "crontab", value: SUMMARY_CRON_UTC }, timezone: "Etc/UTC" },
  );
}
