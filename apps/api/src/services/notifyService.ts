// Resumen diario (07:00 de Montevideo) y aviso de novedades de Schoology por Telegram.
// Los avisos son para el primer email de ADMIN_EMAILS (Lucas).
import { db } from "../lib/db";
import { escapeHtml, sendTelegram, telegramConfigured } from "../lib/telegram";

const TZ = "America/Montevideo";
const APP_URL = "https://lucasramos.uy/dashboard";

// Fecha local (YYYY-MM-DD) en Montevideo
export function localDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

function localTime(d: Date): string {
  return new Intl.DateTimeFormat("es-UY", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// due_date puede venir como "YYYY-MM-DD" (fecha local) o como ISO completo
export function dueLocalDate(due: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : localDate(new Date(due));
}

export async function notifyUserId(): Promise<string | null> {
  const email = (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim().toLowerCase();
  if (!email) return null;
  const rs = await db.execute({
    sql: "SELECT id FROM user WHERE lower(email) = ?",
    args: [email],
  });
  return (rs.rows[0]?.id as string | undefined) ?? null;
}

type TaskRow = { title: string; due_date: string; subject: string | null };
type EventRow = { title: string; start_date: string };

export function buildDailySummary(
  today: string,
  tasks: TaskRow[],
  events: EventRow[],
): string | null {
  const tomorrow = addDays(today, 1);
  const label = (t: TaskRow) => escapeHtml(t.subject ? `${t.title} (${t.subject})` : t.title);

  const overdue = tasks.filter((t) => dueLocalDate(t.due_date) < today);
  const dueToday = tasks.filter((t) => dueLocalDate(t.due_date) === today);
  const dueTomorrow = tasks.filter((t) => dueLocalDate(t.due_date) === tomorrow);
  const eventsToday = events
    .filter((e) => localDate(new Date(e.start_date)) === today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  if (!overdue.length && !dueToday.length && !dueTomorrow.length && !eventsToday.length) {
    return null;
  }

  const lines: string[] = ["<b>Buen día. Esto es lo de hoy:</b>"];
  if (dueToday.length) {
    lines.push("", "<b>Vence hoy</b>", ...dueToday.map((t) => `• ${label(t)}`));
  }
  if (dueTomorrow.length) {
    lines.push("", "<b>Vence mañana</b>", ...dueTomorrow.map((t) => `• ${label(t)}`));
  }
  if (eventsToday.length) {
    lines.push(
      "",
      "<b>Hoy en Schoology</b>",
      ...eventsToday.map((e) => `• ${localTime(new Date(e.start_date))} ${escapeHtml(e.title)}`),
    );
  }
  if (overdue.length) {
    lines.push("", `Atrasadas: ${overdue.length}`);
  }
  lines.push("", `<a href="${APP_URL}/">Abrir el dashboard</a>`);
  return lines.join("\n");
}

export async function sendDailySummary(now = new Date()) {
  if (!telegramConfigured()) return;
  const userId = await notifyUserId();
  if (!userId) return;

  const today = localDate(now);
  const tasksRs = await db.execute({
    sql: `SELECT DISTINCT t.title, t.due_date, s.name AS subject FROM tasks t
          LEFT JOIN subjects s ON t.subject_id = s.id
          WHERE (t.user_id = ? OR s.user_id = ?) AND t.status != 'done' AND t.is_planner = 0
            AND t.due_date >= ? AND t.due_date < ?`,
    args: [userId, userId, addDays(today, -60), addDays(today, 3)],
  });
  const eventsRs = await db.execute({
    sql: "SELECT title, start_date FROM ical_events WHERE user_id = ? AND start_date >= ? AND start_date < ?",
    args: [userId, addDays(today, -1), addDays(today, 2)],
  });

  const text = buildDailySummary(
    today,
    tasksRs.rows as unknown as TaskRow[],
    eventsRs.rows as unknown as EventRow[],
  );
  if (text) await sendTelegram(text);
}

// Aviso silencioso (sin sonido: el sync corre a medianoche) con lo nuevo de Schoology
export function buildNewEventsMessage(events: EventRow[]): string | null {
  if (!events.length) return null;
  const shown = events.slice(0, 10);
  const lines = [
    `<b>Nuevo en Schoology (${events.length})</b>`,
    ...shown.map(
      (e) =>
        `• ${escapeHtml(e.title)} - ${new Intl.DateTimeFormat("es-UY", {
          timeZone: TZ,
          weekday: "short",
          day: "numeric",
          month: "numeric",
        }).format(new Date(e.start_date))}`,
    ),
  ];
  if (events.length > shown.length) lines.push(`… y ${events.length - shown.length} más`);
  return lines.join("\n");
}

export async function notifyNewEvents(userId: string, events: EventRow[]) {
  if (!telegramConfigured()) return;
  if (userId !== (await notifyUserId())) return;
  const text = buildNewEventsMessage(events);
  if (text) await sendTelegram(text, { silent: true });
}
