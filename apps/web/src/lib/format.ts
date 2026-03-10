/**
 * Utilidades de formato para Uruguay (es-UY).
 * Fechas: DD/MM/YYYY · Moneda: UYU · Separador decimal: coma
 */
const LOCALE = "es-UY";

function getValidDate(date?: string | Date | null): Date | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;
  return d;
}

export function formatDate(date?: string | Date | null): string {
  const d = getValidDate(date);
  if (!d) return "";
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatFriendlyDate(date?: string | Date | null): string {
  const d = getValidDate(date);
  if (!d) return "";
  // Formats to something like "15 oct, 2023" to match the prompt
  const day = new Intl.DateTimeFormat(LOCALE, { day: "2-digit" }).format(d);
  const month = new Intl.DateTimeFormat(LOCALE, { month: "short" }).format(d);
  const year = new Intl.DateTimeFormat(LOCALE, { year: "numeric" }).format(d);
  // ensure month doesn't have period if local adds one
  return `${day} ${month.replace(/\./g, "")}, ${year}`;
}

export function formatDateLong(date?: string | Date | null): string {
  const d = getValidDate(date);
  if (!d) return "";
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatDateShort(date?: string | Date | null): string {
  const d = getValidDate(date);
  if (!d) return "";
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
  }).format(d);
}

export function formatRelative(date?: string | Date | null): string {
  const d = getValidDate(date);
  if (!d) return "";
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  const diffSec = (d.getTime() - Date.now()) / 1000;
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
