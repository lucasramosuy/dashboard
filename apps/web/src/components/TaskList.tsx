import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Modal } from "./Modal";
import { TaskForm } from "./TaskForm";
import { StatusBadge } from "./StatusBadge";
import { Toast } from "./Toast";
import { useToast } from "../hooks/useToast";
import type { Task } from "@dashboard/shared-types";
import {
  useTasks,
  useSubjects,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from "../hooks/useDashboardQueries";

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

function formatDate(date?: Date | string): string {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-UY");
}

const btnOutline =
  "px-3 py-1.5 rounded-lg text-xs font-semibold border border-theme-border bg-transparent text-theme-text hover:bg-theme-bg hover:border-theme-accent cursor-pointer transition-all duration-150";

export const TaskList: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: unorderedTasks = [], isLoading: loadingTasks } = useTasks();
  const { data: subjects = [], isLoading: loadingSubjects } = useSubjects();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const loading = loadingTasks || loadingSubjects;
  const tasks = [...unorderedTasks].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
  );

  useEffect(() => {
    if (typeof window !== "undefined" && !authLoading && !user) {
      window.location.replace("/login");
    }
  }, [user, authLoading]);

  const handleSubmit = async (data: Partial<Task>) => {
    if (editingTask) {
      updateTask.mutate(
        { id: editingTask.id, data },
        {
          onSuccess: () => {
            setModalOpen(false);
            setEditingTask(undefined);
            showToast("Tarea actualizada correctamente");
          },
          onError: (e: any) => showToast(e.message, "error"),
        },
      );
    } else {
      createTask.mutate(data, {
        onSuccess: () => {
          setModalOpen(false);
          setEditingTask(undefined);
          showToast("Tarea creada correctamente");
        },
        onError: (e: any) => showToast(e.message, "error"),
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteTask.mutate(id, {
      onSuccess: () => {
        setDeletingId(null);
        showToast("Tarea eliminada");
      },
      onError: (e: any) => showToast(e.message, "error"),
    });
  };

  if (authLoading || loading) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 p-16 text-theme-text-muted text-sm"
        aria-busy="true"
        aria-label="Cargando tareas"
      ></div>
    );
  }

  return (
    <>
      <div className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm">
        <header className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h1 className="m-0 text-theme-text">Tareas</h1>
          <button
            onClick={() => {
              setEditingTask(undefined);
              setModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-lg font-semibold border border-transparent bg-theme-primary text-theme-bg hover:bg-theme-accent hover:-translate-y-px hover:shadow-md cursor-pointer transition-all duration-150"
            aria-label="Nueva Tarea"
          >
            + Nueva
          </button>
        </header>

        {tasks.length === 0 ? (
          <p className="text-theme-text-muted">No hay tareas registradas aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[400px]" aria-label="Lista de tareas">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 border-b-2 border-theme-border text-xs uppercase tracking-wider text-theme-text-muted">
                    Título
                  </th>
                  <th className="text-left px-3 py-2 border-b-2 border-theme-border text-xs uppercase tracking-wider text-theme-text-muted">
                    Vencimiento
                  </th>
                  <th className="text-left px-3 py-2 border-b-2 border-theme-border text-xs uppercase tracking-wider text-theme-text-muted">
                    Estado
                  </th>
                  <th className="text-left px-3 py-2 border-b-2 border-theme-border text-xs uppercase tracking-wider text-theme-text-muted">
                    Tipo
                  </th>
                  <th className="text-left px-3 py-2 border-b-2 border-theme-border text-xs uppercase tracking-wider text-theme-text-muted">
                    Nota
                  </th>
                  <th className="text-right px-3 py-2 border-b-2 border-theme-border text-xs uppercase tracking-wider text-theme-text-muted">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-theme-bg transition-colors">
                    <td className="px-3 py-3 border-b border-theme-border">
                      <a
                        href={`/tasks/${t.slug || t.id}`}
                        className="text-theme-primary font-semibold no-underline hover:underline"
                      >
                        {t.title}
                      </a>
                    </td>
                    <td className="px-3 py-3 border-b border-theme-border text-sm text-theme-text-muted">
                      {formatDate(t.due_date)}
                    </td>
                    <td className="px-3 py-3 border-b border-theme-border">
                      <StatusBadge variant={STATUS_VARIANTS[t.status]}>
                        {STATUS_LABELS[t.status]}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-3 border-b border-theme-border text-sm text-theme-text-muted">
                      {t.type ? t.type.charAt(0).toUpperCase() + t.type.slice(1) : "—"}
                    </td>
                    <td className="px-3 py-3 border-b border-theme-border text-sm font-semibold">
                      {t.grade != null ? t.grade : "—"}
                    </td>
                    <td className="px-3 py-3 border-b border-theme-border">
                      <div className="flex justify-end items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => {
                            setEditingTask(t);
                            setModalOpen(true);
                          }}
                          className={btnOutline}
                          aria-label={`Editar tarea ${t.title}`}
                        >
                          Editar
                        </button>
                        {deletingId === t.id ? (
                          <>
                            <span className="text-xs text-theme-danger">¿Confirmar?</span>
                            <button
                              onClick={() => handleDelete(t.id)}
                              className={`${btnOutline} text-theme-danger`}
                              aria-label="Confirmar eliminación"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className={btnOutline}
                              aria-label="Cancelar eliminación"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeletingId(t.id)}
                            className={`${btnOutline} text-theme-danger`}
                            aria-label={`Eliminar tarea ${t.title}`}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingTask ? "Editar Tarea" : "Nueva Tarea"}
        >
          <TaskForm
            initialData={editingTask}
            subjects={subjects}
            onSubmit={handleSubmit}
            onCancel={() => setModalOpen(false)}
            loading={createTask.isPending || updateTask.isPending}
          />
        </Modal>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </>
  );
};
