import { describe, it, expect } from "bun:test";
import { parseIcs } from "../src/lib/ics";

const ics = (...lines: string[]) =>
  ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Schoology//EN", ...lines, "END:VCALENDAR"].join(
    "\r\n",
  );

describe("parseIcs", () => {
  it("lee UID, SUMMARY, DESCRIPTION y fechas UTC", () => {
    const [ev] = parseIcs(
      ics(
        "BEGIN:VEVENT",
        "UID:a1@schoology.com",
        "DTSTART:20260310T143000Z",
        "DTEND:20260310T153000Z",
        "SUMMARY:Entrega TP 1 - Didáctica",
        "DESCRIPTION:Consigna\\nLeer el capítulo 2\\, resumir\\; entregar\\n- Link: https://app.schoology.com/assignment/1",
        "END:VEVENT",
      ),
    );
    expect(ev.uid).toBe("a1@schoology.com");
    expect(ev.summary).toBe("Entrega TP 1 - Didáctica");
    expect(ev.description).toBe(
      "Consigna\nLeer el capítulo 2, resumir; entregar\n- Link: https://app.schoology.com/assignment/1",
    );
    expect(ev.start?.toISOString()).toBe("2026-03-10T14:30:00.000Z");
    expect(ev.end?.toISOString()).toBe("2026-03-10T15:30:00.000Z");
    expect(ev.allDay).toBe(false);
  });

  it("une líneas plegadas (folding)", () => {
    const [ev] = parseIcs(
      ics(
        "BEGIN:VEVENT",
        "DTSTART:20260310T143000Z",
        "SUMMARY:Un título muy lar",
        " go partido en dos",
        "END:VEVENT",
      ),
    );
    expect(ev.summary).toBe("Un título muy largo partido en dos");
  });

  it("convierte fechas con TZID a UTC", () => {
    const [ev] = parseIcs(
      ics(
        "BEGIN:VEVENT",
        "DTSTART;TZID=America/Montevideo:20260310T090000",
        "SUMMARY:Clase",
        "END:VEVENT",
      ),
    );
    expect(ev.start?.toISOString()).toBe("2026-03-10T12:00:00.000Z"); // UTC-3
  });

  it("respeta el horario de verano de otra zona", () => {
    const [ev] = parseIcs(
      ics(
        "BEGIN:VEVENT",
        'DTSTART;TZID="America/New_York":20260710T090000',
        "SUMMARY:Clase",
        "END:VEVENT",
      ),
    );
    expect(ev.start?.toISOString()).toBe("2026-07-10T13:00:00.000Z"); // EDT = UTC-4
  });

  it("toma las fechas flotantes como hora de Montevideo", () => {
    const [ev] = parseIcs(
      ics("BEGIN:VEVENT", "DTSTART:20260310T090000", "SUMMARY:Clase", "END:VEVENT"),
    );
    expect(ev.start?.toISOString()).toBe("2026-03-10T12:00:00.000Z");
  });

  it("maneja eventos de día completo sin correr la fecha", () => {
    const [ev] = parseIcs(
      ics("BEGIN:VEVENT", "DTSTART;VALUE=DATE:20260315", "SUMMARY:Parcial", "END:VEVENT"),
    );
    expect(ev.allDay).toBe(true);
    expect(ev.start?.toISOString()).toBe("2026-03-15T12:00:00.000Z");
  });

  it("ignora VALARM y otros componentes anidados", () => {
    const evs = parseIcs(
      ics(
        "BEGIN:VEVENT",
        "DTSTART:20260310T143000Z",
        "SUMMARY:Con alarma",
        "BEGIN:VALARM",
        "DESCRIPTION:Recordatorio",
        "END:VALARM",
        "END:VEVENT",
        "BEGIN:VTODO",
        "SUMMARY:No es evento",
        "END:VTODO",
      ),
    );
    expect(evs.length).toBe(1);
    expect(evs[0].description).toBeUndefined();
  });

  it("acepta saltos de línea LF y fechas inválidas sin romper", () => {
    const evs = parseIcs("BEGIN:VEVENT\nDTSTART:no-es-fecha\nSUMMARY:Rota\nEND:VEVENT\n");
    expect(evs.length).toBe(1);
    expect(evs[0].start).toBeUndefined();
  });
});
