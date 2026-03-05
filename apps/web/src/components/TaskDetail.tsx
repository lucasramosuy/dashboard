import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { StatusBadge } from "./StatusBadge";
import type { Task } from "@dashboard/shared-types";
import { useTask, useUpdateTaskStatus } from "../hooks/useDashboardQueries";

interface Props {
  id: string;
}

function formatDate(date?: Date | string): string {
  if (!date) return "Sin fecha";
  const d = date instanceof Date ? date : new Date(date);
  return isNaN(d.getTime())
    ? "Sin fecha"
    : d.toLocaleDateString("es-UY", { year: "numeric", month: "long", day: "numeric" });
}

const STATUS_LABELS: Record<Task["status"], string> = {
  todo: "Pendiente",
  "in-progress": "En proceso",
  done: "Completada",
};
const STATUS_VARIANTS: Record<Task["status"], "warning" | "info" | "success"> = {
  todo: "warning",
  "in-progress": "info",
  done: "success",
};
const NEXT_STATUS: Record<Task["status"], Task["status"]> = {
  todo: "in-progress",
  "in-progress": "done",
  done: "todo",
};

const labelCls = "text-sm uppercase tracking-wider mb-2 text-theme-text-muted";

export const TaskDetail: React.FC<Props> = ({ id }) => {
  const { user, loading: authLoading } = useAuth();
  const { data: task, isLoading, error } = useTask(id);
  const updateTaskStatus = useUpdateTaskStatus();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !authLoading && !user) window.location.replace("/login");
  }, [user, authLoading]);

  const advanceStatus = () => {
    if (!task) return;
    setActionError(null);
    updateTaskStatus.mutate(
      { id: task.id, status: NEXT_STATUS[task.status] },
      { onError: (e: any) => setActionError(e.message) },
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center p-16" aria-busy="true" aria-label="Cargando tarea">
        <div className="w-8 h-8 border-3 border-theme-border border-t-theme-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) return <p className="text-theme-danger">Error al cargar la tarea</p>;
  if (!task) return <p className="text-theme-text-muted">Tarea no encontrada.</p>;

  return (
    <div className="max-w-[800px] mx-auto">
      <header className="flex justify-between items-center mb-10 border-b border-theme-border pb-4">
        <h1 className="m-0 text-theme-text">{task.title}</h1>
        <StatusBadge variant={STATUS_VARIANTS[task.status]}>
          {STATUS_LABELS[task.status]}
        </StatusBadge>
      </header>

      <section className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm mb-10">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8 mb-8 border-b border-theme-border pb-6">
          <div>
            <h4 className={labelCls}>Fecha de Vencimiento</h4>
            <p className="text-lg font-bold m-0">{formatDate(task.due_date)}</p>
          </div>
          <div>
            <h4 className={labelCls}>UC</h4>
            <p className="text-lg font-bold m-0">
              <a
                href={`/subjects/${task.subject_id}`}
                className="text-theme-primary no-underline hover:underline"
                aria-label="Ir a los detalles de la UC cursada"
              >
                Ver UC
              </a>
            </p>
          </div>
        </div>

        <div>
          <h4 className={labelCls}>Descripcion</h4>
          <p className="text-base leading-relaxed text-theme-text-muted bg-theme-bg p-6 rounded-lg m-0">
            {task.description || "Esta tarea no tiene descripcion."}
          </p>
        </div>
      </section>

      <footer className="flex flex-col gap-4 border-t border-theme-border pt-8">
        {actionError && <p className="text-theme-danger text-sm m-0">{actionError}</p>}
        <div className="flex gap-4">
          <button
            onClick={advanceStatus}
            className="px-5 py-2.5 rounded-lg font-semibold border border-transparent bg-theme-primary text-theme-bg hover:bg-theme-accent cursor-pointer transition-all duration-150 disabled:opacity-45 disabled:cursor-not-allowed"
            disabled={updateTaskStatus.isPending}
            aria-label={`Avanzar tarea al estado: ${STATUS_LABELS[NEXT_STATUS[task.status]]}`}
          >
            {updateTaskStatus.isPending
              ? "Actualizando..."
              : `Marcar como ${STATUS_LABELS[NEXT_STATUS[task.status]]}`}
          </button>
          <button
            onClick={() => (window.location.href = "/tasks")}
            className="px-5 py-2.5 rounded-lg font-semibold border border-theme-border bg-transparent text-theme-text hover:bg-theme-bg hover:border-theme-accent cursor-pointer transition-all duration-150"
            aria-label="Volver a lista de tareas"
          >
            Volver a Tareas
          </button>
        </div>
      </footer>
    </div>
  );
};
