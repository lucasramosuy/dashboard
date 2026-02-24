import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { StatusBadge } from "./StatusBadge";
import type { Task } from "@dashboard/shared-types";

interface Props {
  id: string;
}

function formatDate(date?: Date | string): string {
  if (!date) return "Sin fecha";
  const d = date instanceof Date ? date : new Date(date);
  return isNaN(d.getTime())
    ? "Sin fecha"
    : d.toLocaleDateString("es-UY", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

const STATUS_LABELS: Record<Task["status"], string> = {
  todo: "Pendiente",
  "in-progress": "En proceso",
  done: "Completada",
};

const STATUS_VARIANTS: Record<Task["status"], "warning" | "info" | "success"> =
  {
    todo: "warning",
    "in-progress": "info",
    done: "success",
  };

const NEXT_STATUS: Record<Task["status"], Task["status"]> = {
  todo: "in-progress",
  "in-progress": "done",
  done: "todo",
};

export const TaskDetail: React.FC<Props> = ({ id }) => {
  const { user, token, loading: authLoading } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) window.location.href = "/login";
  }, [user, authLoading]);

  useEffect(() => {
    if (token && id) {
      setLoading(true);
      api
        .getTask(token, id)
        .then(setTask)
        .catch((err) => {
          console.error(err);
          setError(err.message || "No se pudo cargar la tarea.");
        })
        .finally(() => setLoading(false));
    }
  }, [token, id]);

  const advanceStatus = async () => {
    if (!token || !task) return;
    try {
      const updated = await api.updateTaskStatus(
        token,
        task.id,
        NEXT_STATUS[task.status],
      );
      setTask(updated);
    } catch (err: any) {
      alert(`Error al actualizar estado: ${err.message}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "4rem" }}
      >
        <div className="oat-spinner" />
      </div>
    );
  }

  if (error) {
    return <p style={{ color: "var(--oat-danger)" }}>Error: {error}</p>;
  }

  if (!task) {
    return (
      <p style={{ color: "var(--oat-text-muted)" }}>Tarea no encontrada.</p>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2.5rem",
          borderBottom: "1px solid var(--oat-border)",
          paddingBottom: "1rem",
        }}
      >
        <h1 style={{ margin: 0 }}>{task.title}</h1>
        <StatusBadge variant={STATUS_VARIANTS[task.status]}>
          {STATUS_LABELS[task.status]}
        </StatusBadge>
      </header>

      <section className="oat-card" style={{ marginBottom: "2.5rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "2rem",
            marginBottom: "2rem",
            borderBottom: "1px solid var(--oat-border)",
            paddingBottom: "1.5rem",
          }}
        >
          <div>
            <h4
              style={{
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.5rem",
                color: "var(--oat-text-muted)",
              }}
            >
              Fecha de Vencimiento
            </h4>
            <p style={{ fontSize: "1.125rem", fontWeight: "bold", margin: 0 }}>
              {formatDate(task.due_date)}
            </p>
          </div>
          <div>
            <h4
              style={{
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.5rem",
                color: "var(--oat-text-muted)",
              }}
            >
              Materia
            </h4>
            <p style={{ fontSize: "1.125rem", fontWeight: "bold", margin: 0 }}>
              <a
                href={`/subjects/${task.subject_id}`}
                style={{ color: "var(--oat-primary)", textDecoration: "none" }}
              >
                Ver materia
              </a>
            </p>
          </div>
        </div>

        <div>
          <h4
            style={{
              fontSize: "0.875rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.75rem",
              color: "var(--oat-text-muted)",
            }}
          >
            Descripcion
          </h4>
          <p
            style={{
              fontSize: "1rem",
              lineHeight: "1.6",
              color: "var(--oat-text-muted)",
              background: "var(--oat-bg)",
              padding: "1.5rem",
              borderRadius: "8px",
              margin: 0,
            }}
          >
            {task.description || "Esta tarea no tiene descripcion."}
          </p>
        </div>
      </section>

      <footer
        style={{
          display: "flex",
          gap: "1rem",
          borderTop: "1px solid var(--oat-border)",
          paddingTop: "2rem",
        }}
      >
        <button onClick={advanceStatus} className="oat-btn oat-btn-primary">
          Marcar como {STATUS_LABELS[NEXT_STATUS[task.status]]}
        </button>
        <button
          onClick={() => (window.location.href = "/tasks")}
          className="oat-btn oat-btn-outline"
        >
          Volver a Tareas
        </button>
      </footer>
    </div>
  );
};
