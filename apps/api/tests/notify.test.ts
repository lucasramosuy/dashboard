import { describe, it, expect } from "bun:test";
import {
  buildDailySummary,
  buildNewEventsMessage,
  dueLocalDate,
  localDate,
} from "../src/services/notifyService";
import { sendTelegram } from "../src/lib/telegram";

describe("notifyService", () => {
  it("usa la fecha de Montevideo (UTC-3)", () => {
    // 01:00 UTC del 25 = 22:00 del 24 en Montevideo
    expect(localDate(new Date("2026-09-25T01:00:00Z"))).toBe("2026-09-24");
    expect(dueLocalDate("2026-09-24")).toBe("2026-09-24");
    expect(dueLocalDate("2026-09-25T02:00:00.000Z")).toBe("2026-09-24");
  });

  it("arma el resumen con hoy, mañana, eventos y atrasadas", () => {
    const text = buildDailySummary(
      "2026-09-25",
      [
        { title: "Parcial <Física>", due_date: "2026-09-25", subject: "Física" },
        { title: "Informe", due_date: "2026-09-26T15:00:00.000Z", subject: null },
        { title: "Viejo", due_date: "2026-09-20", subject: null },
      ],
      [{ title: "Clase & taller", start_date: "2026-09-25T13:00:00.000Z" }],
    );
    expect(text).toContain("<b>Vence hoy</b>\n• Parcial &lt;Física&gt; (Física)");
    expect(text).toContain("<b>Vence mañana</b>\n• Informe");
    expect(text).toContain("10:00 Clase &amp; taller");
    expect(text).toContain("Atrasadas: 1");
  });

  it("no manda nada si no hay nada", () => {
    expect(buildDailySummary("2026-09-25", [], [])).toBeNull();
    expect(buildNewEventsMessage([])).toBeNull();
  });

  it("lista lo nuevo de Schoology con tope de 10", () => {
    const events = Array.from({ length: 12 }, (_, i) => ({
      title: `Tarea ${i}`,
      start_date: "2026-09-28T15:00:00.000Z",
    }));
    const text = buildNewEventsMessage(events)!;
    expect(text).toContain("Nuevo en Schoology (12)");
    expect(text).toContain("… y 2 más");
  });

  it("sin token no manda mensajes", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    expect(await sendTelegram("hola")).toBe(false);
  });
});
