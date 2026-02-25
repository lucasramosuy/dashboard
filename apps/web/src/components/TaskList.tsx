import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Modal } from "./Modal";
import { TaskForm } from "./TaskForm";
import { StatusBadge } from "./StatusBadge";
import { Toast } from "./Toast";
import { useToast } from "../hooks/useToast";
import type { Task, Subject } from "@dashboard/shared-types";

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
  const { user, token, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const fetchData = async () => {
    if (!token) return;
    try {
      const [taskData, subjectData] = await Promise.all([
        api.getTasks(token),
        api.getSubjects(token),
      ]);
      // Ordenar por fecha de vencimiento ascendente
      const sorted = [...taskData].sort(
        (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
      );
      setTasks(sorted);
      setSubjects(subjectData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) window.location.href = "/login";
  }, [user, authLoading]);

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleSubmit = async (data: Partial<Task>) => {
    if (!token) return;
    setSubmitting(true);
    try {
      if (editingTask) {
        await api.updateTask(token, editingTask.id, data);
      } else {
        await api.createTask(token, data);
      }
      setModalOpen(false);
      setEditingTask(undefined);
      await fetchData();
      showToast(`Tarea ${editingTask ? "actualizada" : "creada"} correctamente`);
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await api.deleteTask(token, id);
      setDeletingId(null);
      await fetchData();
      showToast("Tarea eliminada");
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="oat-spinner-wrapper">
        <div className="oat-spinner" />
        <span>Cargando...</span>
      </div>
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
          >
            + Nueva
          </button>
        </header>

        {tasks.length === 0 ? (
          <p className="oat-text-secondary">No hay tareas registradas aún.</p>
        ) : (
          <div className="table-responsive">
            <table className="subjects-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
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
                    <td>
                      <div className="subjects-actions">
                        <button
                          onClick={() => {
                            setEditingTask(t);
                            setModalOpen(true);
                          }}
                          className="oat-btn oat-btn-outline"
                          style={{ fontSize: "0.75rem" }}
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
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="oat-btn oat-btn-outline"
                              style={{ fontSize: "0.75rem" }}
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeletingId(t.id)}
                            className="oat-btn oat-btn-outline"
                            style={{ fontSize: "0.75rem", color: "var(--oat-danger)" }}
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
            loading={submitting}
          />
        </Modal>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </>
  );
};
