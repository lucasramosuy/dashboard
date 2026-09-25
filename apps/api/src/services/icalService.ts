import { parseIcs } from "../lib/ics";
import { db, dbService } from "../lib/db";
import { IcalEvent } from "@dashboard/shared-types";
import { logger } from "../lib/logger";

export const icalService = {
  syncUserCalendar: async (userId: string, icalUrl: string) => {
    if (!icalUrl) {
      throw new Error("El usuario no tiene una URL de iCal configurada.");
    }

    try {
      // 1. Fetch and parse calendar
      const res = await fetch(icalUrl, { headers: { Accept: "text/calendar" } });
      if (!res.ok) throw new Error(`HTTP ${res.status} al descargar el iCal`);
      const events = parseIcs(await res.text());

      // 2. Resolve events
      const eventsToInsert: IcalEvent[] = [];
      const now = new Date();

      for (const event of events) {
        if (event.summary && event.start) {
          const eventStart = event.start;
          if (eventStart.getTime() < now.getTime() - 1000 * 60 * 60 * 24 * 30) {
            continue;
          }

          let description = event.description ? String(event.description) : "";
          let url = "";

          const linkMatch = description.match(/- Link:\s*(https?:\/\/[^\s]+)/);
          if (linkMatch) {
            url = linkMatch[1];
            description = description.replace(/- Link:\s*https?:\/\/[^\s]+/g, "").trim();
          }

          eventsToInsert.push({
            id: globalThis.crypto.randomUUID(),
            user_id: userId,
            title: event.summary,
            description: description,
            url: url,
            start_date: eventStart,
          });
        }
      }

      // 3. Eventos futuros que no estaban en el sync anterior (para el aviso por Telegram).
      // Los ids se regeneran en cada sync, así que se compara por título + fecha.
      // Si antes no había nada (primer sync), no se marca nada como nuevo.
      const prev = await db.execute({
        sql: "SELECT title, start_date FROM ical_events WHERE user_id = ?",
        args: [userId],
      });
      const key = (title: string, start: string) => `${title}|${start}`;
      const known = new Set(prev.rows.map((r) => key(r.title as string, r.start_date as string)));
      const newEvents =
        prev.rows.length === 0
          ? []
          : eventsToInsert
              .filter((e) => new Date(e.start_date).getTime() >= now.getTime())
              .map((e) => ({ title: e.title, start_date: new Date(e.start_date).toISOString() }))
              .filter((e) => !known.has(key(e.title, e.start_date)));

      // 4. Update the DB — atomic batch replace (ARCH-8)
      await dbService.icalEvents.replaceByUser(userId, eventsToInsert);

      // 5. Update user last sync
      await db.execute({
        sql: "UPDATE user SET last_ical_sync = ? WHERE id = ?",
        args: [now.toISOString(), userId],
      });

      return {
        success: true,
        syncedCount: eventsToInsert.length,
        newEvents,
      };
    } catch (error) {
      logger.error("[icalService] Error al sincronizar iCal:", error);
      throw new Error("No se pudo procesar el feed de iCal. Verifica que la URL sea válida.", {
        cause: error,
      });
    }
  },
};
