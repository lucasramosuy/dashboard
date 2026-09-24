/**
 * Utilidades de formato para Uruguay (es-UY).
 * Fechas: DD/MM/YYYY · Moneda: UYU · Separador decimal: coma
 */
const LOCALE = "es-UY";

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateLong(date: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

export function formatRelative(date: string | Date): string {
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  const diffSec = (new Date(date).getTime() - Date.now()) / 1000;
  if (Math.abs(diffSec) < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (Math.abs(diffSec) < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  return rtf.format(Math.round(diffSec / 86400), "day");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "UYU",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat(LOCALE).format(n);
}

/* ------------------------------------------------------------------
 * Fechas "de día" (sin hora). El API guarda fechas cortas como
 * medianoche UTC; en Uruguay (-03) eso caía el día anterior.
 * toLocalDay() las interpreta como día calendario local.
 * ------------------------------------------------------------------ */
export function toLocalDay(date: string | Date): Date {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = date instanceof Date ? date : new Date(date);
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function dayKey(date: string | Date = new Date()): string {
  const d = toLocalDay(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function todayKey(): string {
  return dayKey(new Date());
}

export function formatDay(date: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    toLocalDay(date),
  );
}

export function formatDayShort(date: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE, { weekday: "short", day: "numeric", month: "short" }).format(
    toLocalDay(date),
  );
}

export function formatDayLong(date: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", year: "numeric" }).format(
    toLocalDay(date),
  );
}

/** Días entre hoy y la fecha (negativo = vencida). */
export function daysUntil(date: string | Date): number {
  const target = toLocalDay(date).getTime();
  const t = new Date();
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
  return Math.round((target - today) / 86400000);
}

export function dueLabel(date: string | Date): string {
  const n = daysUntil(date);
  if (n === 0) return "Hoy";
  if (n === 1) return "Mañana";
  if (n === -1) return "Ayer";
  if (n < 0) return `Vencida hace ${-n} días`;
  if (n < 7) return `En ${n} días`;
  return formatDayShort(date);
}

/* ------------------------------------------------------------------
 * Asistencia CFE: mínimo 75% → máximo de faltas = 25% de las clases.
 * ------------------------------------------------------------------ */
export interface AttendanceInfo {
  percentage: number;
  absences: number;
  maxAbsences: number;
  remaining: number;
  status: "ok" | "warning" | "danger";
}

export function attendanceInfo(totalClasses: number, absenceValue: number): AttendanceInfo {
  const maxAbsences = Math.floor(totalClasses * 0.25 * 2) / 2;
  const remaining = Math.max(0, maxAbsences - absenceValue);
  const percentage =
    totalClasses > 0 ? Math.max(0, Math.round(((totalClasses - absenceValue) / totalClasses) * 100)) : 100;
  const status: AttendanceInfo["status"] =
    absenceValue >= maxAbsences && totalClasses > 0 ? "danger" : remaining <= 2 && totalClasses > 0 ? "warning" : "ok";
  return { percentage, absences: absenceValue, maxAbsences, remaining, status };
}

export function remainingLabel(info: AttendanceInfo): string {
  if (info.status === "danger") return "Superaste el límite de faltas";
  const r = info.remaining;
  return `Te ${r === 1 ? "queda" : "quedan"} ${formatNumber(r)} ${r === 1 ? "falta" : "faltas"}`;
}

export function average(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}
