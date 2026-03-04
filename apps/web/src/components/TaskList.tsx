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

export const TaskList: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  // React Query Hooks
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

  // Ordenar por fecha de vencimiento ascendente
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
      <div className="oat-spinner-wrapper" aria-busy="true" aria-label="Cargando tareas"></div>
    );
  }

  return (
    <>
      <div className="oat-card">
        <header className="subjects-header">
          <h1 style={{ margin: 0 }}>Tareas</h1>
          <button
            onClick={() => {
              setEditingTask(undefined);
              setModalOpen(true);
            }}
            className="oat-btn oat-btn-primary"
            aria-label="Nueva Tarea"
          >
            + Nueva
          </button>
        </header>

        {tasks.length === 0 ? (
          <p className="oat-text-secondary">No hay tareas registradas aún.</p>
        ) : (
          <div className="table-responsive">
            <table className="subjects-table" aria-label="Lista de tareas">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  <th>Tipo</th>
                  <th>Nota</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className="subjects-row">
                    <td>
                      <a href={`/tasks/${t.id}`} className="subjects-link">
                        {t.title}
                      </a>
                    </td>
                    <td style={{ fontSize: "0.875rem", color: "var(--oat-text-muted)" }}>
                      {formatDate(t.due_date)}
                    </td>
                    <td>
                      <StatusBadge variant={STATUS_VARIANTS[t.status]}>
                        {STATUS_LABELS[t.status]}
                      </StatusBadge>
                    </td>
                    <td style={{ fontSize: "0.875rem", color: "var(--oat-text-muted)" }}>
                      {t.type ? t.type.charAt(0).toUpperCase() + t.type.slice(1) : "—"}
                    </td>
                    <td style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                      {t.grade != null ? t.grade : "—"}
                    </td>
                    <td>
                      <div className="subjects-actions">
                        <button
                          onClick={() => {
                            setEditingTask(t);
                            setModalOpen(true);
                          }}
                          className="oat-btn oat-btn-outline"
                          style={{ fontSize: "0.75rem" }}
                          aria-label={`Editar tarea ${t.title}`}
                        >
                          Editar
                        </button>
                        {deletingId === t.id ? (
                          <>
                            <span style={{ fontSize: "0.75rem", color: "var(--oat-danger)" }}>
                              ¿Confirmar?
                            </span>
                            <button
                              onClick={() => handleDelete(t.id)}
                              className="oat-btn oat-btn-outline"
                              style={{ fontSize: "0.75rem", color: "var(--oat-danger)" }}
                              aria-label="Confirmar eliminación"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="oat-btn oat-btn-outline"
                              style={{ fontSize: "0.75rem" }}
                              aria-label="Cancelar eliminación"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeletingId(t.id)}
                            className="oat-btn oat-btn-outline"
                            style={{ fontSize: "0.75rem", color: "var(--oat-danger)" }}
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
