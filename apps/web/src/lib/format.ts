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
