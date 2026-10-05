import type { Absence, Subject, Task } from "./types";

/* ------------------------------------------------------------------
 * Asistencia CFE: mínimo 75% → máximo de faltas = 25% de las clases.
 * Vive acá (y no en el front) para que el panel y el bot de Telegram
 * midan lo mismo.
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
    totalClasses > 0
      ? Math.max(0, Math.round(((totalClasses - absenceValue) / totalClasses) * 100))
      : 100;
  const status: AttendanceInfo["status"] =
    absenceValue >= maxAbsences && totalClasses > 0
      ? "danger"
      : remaining <= 2 && totalClasses > 0
        ? "warning"
        : "ok";
  return { percentage, absences: absenceValue, maxAbsences, remaining, status };
}

/* ------------------------------------------------------------------
 * Salud por UC: el nivel es el PEOR de las señales, sin puntajes
 * inventados. Cada señal aporta una razón en texto.
 * ------------------------------------------------------------------ */
export type HealthLevel = "ok" | "attention" | "risk";

export interface HealthReason {
  level: Exclude<HealthLevel, "ok">;
  signal: "attendance" | "overdue" | "due-soon" | "average";
  text: string;
}

export interface SubjectHealth<T = Task> {
  level: HealthLevel;
  reasons: HealthReason[];
  /** Falta de datos: sin clases cargadas ni tareas. */
  empty: boolean;
  nextTask: T | null;
}

/** Promedio desde el cual se exonera. */
export const EXONERATION_GRADE = 9;
/** Días hacia adelante en los que una entrega pendiente pide atención. */
export const DUE_SOON_DAYS = 3;

const DAY_MS = 86_400_000;

/** Día calendario (YYYY-MM-DD) de una fecha del API: mismas reglas que toLocalDay del front. */
export function healthDayKey(date: string | Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const d = date instanceof Date ? date : new Date(date);
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dayNumber(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / DAY_MS;
}

/** Días entre `today` y la fecha (negativo = vencida). */
export function daysBetween(today: string, date: string | Date): number {
  return dayNumber(healthDayKey(date)) - dayNumber(today);
}

function num(n: number): string {
  return String(Math.round(n * 10) / 10).replace(".", ",");
}

function dueText(days: number): string {
  if (days <= 0) return "vence hoy";
  if (days === 1) return "vence mañana";
  return `vence en ${days} días`;
}

type HealthTask = Pick<Task, "title" | "status" | "due_date" | "grade">;

interface HealthInput<T extends HealthTask> {
  subject: Pick<Subject, "total_classes">;
  absences: Pick<Absence, "calculated_value">[];
  /** Solo las tareas de esta UC. */
  tasks: T[];
  /** Día de hoy como YYYY-MM-DD. */
  today: string;
}

export function subjectHealth<T extends HealthTask>({
  subject,
  absences,
  tasks,
  today,
}: HealthInput<T>): SubjectHealth<T> {
  const reasons: HealthReason[] = [];

  const absenceValue = absences.reduce((sum, a) => sum + (a.calculated_value || 0), 0);
  const info = attendanceInfo(subject.total_classes, absenceValue);
  if (info.status === "danger") {
    reasons.push({ level: "risk", signal: "attendance", text: "Superaste el límite de faltas" });
  } else if (info.status === "warning") {
    const r = info.remaining;
    reasons.push({
      level: "attention",
      signal: "attendance",
      text: `Te ${r === 1 ? "queda" : "quedan"} ${num(r)} ${r === 1 ? "falta" : "faltas"}`,
    });
  }

  const pending = tasks.filter((t) => t.status !== "done");
  const overdue = pending.filter((t) => daysBetween(today, t.due_date) < 0);
  if (overdue.length >= 2) {
    reasons.push({
      level: "risk",
      signal: "overdue",
      text: `${overdue.length} tareas vencidas`,
    });
  } else if (overdue.length === 1) {
    reasons.push({ level: "attention", signal: "overdue", text: "1 tarea vencida" });
  }

  const upcoming = pending
    .filter((t) => daysBetween(today, t.due_date) >= 0)
    .sort((a, b) => daysBetween(today, a.due_date) - daysBetween(today, b.due_date));
  const dueSoon = upcoming.filter(
    (t) => t.status === "todo" && daysBetween(today, t.due_date) <= DUE_SOON_DAYS,
  );
  if (dueSoon[0]) {
    const extra = dueSoon.length - 1;
    reasons.push({
      level: "attention",
      signal: "due-soon",
      text: `${dueSoon[0].title} ${dueText(daysBetween(today, dueSoon[0].due_date))}${
        extra > 0 ? ` (y ${extra} más)` : ""
      }`,
    });
  }

  const grades = tasks.map((t) => t.grade).filter((g): g is number => g != null);
  if (grades.length) {
    const avg = Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 10) / 10;
    if (avg < EXONERATION_GRADE) {
      reasons.push({
        level: "attention",
        signal: "average",
        text: `Promedio ${num(avg)}, exonerás con ${EXONERATION_GRADE}`,
      });
    }
  }

  reasons.sort((a, b) => (a.level === b.level ? 0 : a.level === "risk" ? -1 : 1));
  const level: HealthLevel = reasons.some((r) => r.level === "risk")
    ? "risk"
    : reasons.length
      ? "attention"
      : "ok";

  return {
    level,
    reasons,
    empty: subject.total_classes === 0 && tasks.length === 0,
    nextTask: upcoming[0] ?? null,
  };
}

export const HEALTH_LABEL: Record<HealthLevel, string> = {
  ok: "Al día",
  attention: "Atención",
  risk: "En riesgo",
};
