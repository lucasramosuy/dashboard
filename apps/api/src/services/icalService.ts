import ical from "node-ical";
import { db, dbService } from "../lib/db";
import { IcalEvent } from "@dashboard/shared-types";

export const icalService = {
  syncUserCalendar: async (userId: string, icalUrl: string) => {
    if (!icalUrl) {
      throw new Error("El usuario no tiene una URL de iCal configurada.");
    }

    try {
      // 1. Fetch and parse calendar
      const events = await ical.async.fromURL(icalUrl);

      // 2. Resolve events
      const eventsToInsert: IcalEvent[] = [];
      const now = new Date();

      for (const rawEvent of Object.values(events)) {
        const event = rawEvent as any;
        if (event && event.type === "VEVENT" && event.summary) {
          const eventStart = new Date(event.start);
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
            title: String(event.summary),
            description: description,
            url: url,
            start_date: eventStart,
          });
        }
      }

      // 3. Update the DB
      await dbService.icalEvents.deleteByUser(userId);
      await dbService.icalEvents.insertBatch(eventsToInsert);

      // 4. Update user last sync
      await db.execute({
        sql: "UPDATE user SET last_ical_sync = ? WHERE id = ?",
        args: [now.toISOString(), userId],
      });

      return {
        success: true,
        syncedCount: eventsToInsert.length,
      };
    } catch (error) {
      console.error("Error al sincronizar iCal:", error);
      throw new Error("No se pudo procesar el feed de iCal. Verifica que la URL sea válida.", {
        cause: error,
      });
    }
  },
};
