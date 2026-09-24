// Parser mínimo de iCalendar (RFC 5545) para los feeds de Schoology.
//
// Reemplaza a node-ical: en Cloudflare Workers node-ical consume 5-24 ms de CPU
// para un feed de 300 eventos (límite del plan gratuito: 10 ms); este parser ~1 ms.
// Soporta lo que usamos: VEVENT con UID, SUMMARY, DESCRIPTION, DTSTART, DTEND,
// fechas UTC ("Z"), con TZID, flotantes y de día completo (VALUE=DATE).
// No expande RRULE: Schoology exporta cada entrega como evento suelto.

export interface IcsEvent {
  uid?: string;
  summary?: string;
  description?: string;
  start?: Date;
  end?: Date;
  allDay: boolean;
}

// Zona por defecto para fechas sin "Z" ni TZID (flotantes)
const DEFAULT_TZ = "America/Montevideo";

function unescapeText(v: string): string {
  return v.replace(/\\([nN,;\\])/g, (_, c: string) => (c === "n" || c === "N" ? "\n" : c));
}

// Offset (ms) de una zona IANA en un instante dado
function tzOffset(timeZone: string, utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - utcMs;
}

function zonedToUtc(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  s: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  let ms = guess - tzOffset(timeZone, guess);
  // Segunda pasada por si el primer offset cayó del otro lado de un cambio de horario
  ms = guess - tzOffset(timeZone, ms);
  return new Date(ms);
}

export function parseIcsDate(
  value: string,
  params: Record<string, string>,
): { date?: Date; allDay: boolean } {
  const m = value.trim().match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return { allDay: false };
  const [, y, mo, d, h, mi, s, z] = m;
  if (h === undefined || params.VALUE === "DATE") {
    // Día completo: mediodía UTC para que la fecha no cambie en ninguna zona de América
    return { date: new Date(Date.UTC(+y, +mo - 1, +d, 12)), allDay: true };
  }
  if (z) return { date: new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)), allDay: false };
  let tz = params.TZID?.replace(/^"|"$/g, "") || DEFAULT_TZ;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
  } catch {
    tz = DEFAULT_TZ;
  }
  return { date: zonedToUtc(+y, +mo, +d, +h, +mi, +s, tz), allDay: false };
}

export function parseIcs(text: string): IcsEvent[] {
  // Unfold: una línea que empieza con espacio o tab continúa la anterior
  const lines = text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const events: IcsEvent[] = [];
  let ev: IcsEvent | null = null;
  let depth = 0; // ignora sub-componentes como VALARM

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      ev = { allDay: false };
      depth = 0;
      continue;
    }
    if (!ev) continue;
    if (line.startsWith("BEGIN:")) {
      depth++;
      continue;
    }
    if (line.startsWith("END:")) {
      if (line === "END:VEVENT" && depth === 0) {
        events.push(ev);
        ev = null;
      } else depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth > 0) continue;

    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const [name, ...rawParams] = line.slice(0, colon).split(";");
    const value = line.slice(colon + 1);
    const params: Record<string, string> = {};
    for (const p of rawParams) {
      const eq = p.indexOf("=");
      if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1);
    }

    switch (name.toUpperCase()) {
      case "UID":
        ev.uid = value;
        break;
      case "SUMMARY":
        ev.summary = unescapeText(value);
        break;
      case "DESCRIPTION":
        ev.description = unescapeText(value);
        break;
      case "DTSTART": {
        const r = parseIcsDate(value, params);
        ev.start = r.date;
        ev.allDay = r.allDay;
        break;
      }
      case "DTEND":
        ev.end = parseIcsDate(value, params).date;
        break;
    }
  }
  return events;
}
