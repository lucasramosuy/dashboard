import type { Subject, Task } from "./types";
import { daysBetween } from "./health";

export interface NextAction {
  task: Task;
  subjectName: string | null;
  days: number;
  reason: string;
}

/** Próxima acción verificable: tareas pendientes, por fecha y desempate estable. */
export function nextAction(tasks: Task[], subjects: Subject[], today: string): NextAction | null {
  const pending = tasks
    .filter((task) => task.status !== "done" && Number.isFinite(daysBetween(today, task.due_date)))
    .sort((a, b) => {
      const date = daysBetween(today, a.due_date) - daysBetween(today, b.due_date);
      if (date) return date;
      const progress = Number(b.status === "in-progress") - Number(a.status === "in-progress");
      return progress || a.id.localeCompare(b.id);
    });
  const task = pending[0];
  if (!task) return null;
  const days = daysBetween(today, task.due_date);
  const reason =
    days < 0
      ? `Venció hace ${-days} ${days === -1 ? "día" : "días"}`
      : days === 0
        ? "Vence hoy"
        : days === 1
          ? "Vence mañana"
          : `Vence en ${days} días`;
  return {
    task,
    subjectName: subjects.find((subject) => subject.id === task.subject_id)?.name ?? null,
    days,
    reason,
  };
}
