import type { Task } from "./types";

export type TaskStage = "pending" | "progress" | "submitted" | "graded";
export const TASK_STAGES: { id: TaskStage; label: string }[] = [
  { id: "pending", label: "Pendiente" },
  { id: "progress", label: "En curso" },
  { id: "submitted", label: "Entregada" },
  { id: "graded", label: "Calificada" },
];

/** Proyección visual de campos existentes; no crea estados ni cambia datos. */
export function taskStage(task: Pick<Task, "status" | "grade">): TaskStage {
  if (task.status === "done") return task.grade != null ? "graded" : "submitted";
  return task.status === "in-progress" ? "progress" : "pending";
}
