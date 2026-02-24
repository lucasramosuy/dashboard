import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { StatusBadge } from "./StatusBadge";
import type { Subject, Task, Absence } from "@dashboard/shared-types";

interface Props {
  id: string;
}

export const SubjectDetail: React.FC<Props> = ({ id }) => {
  const { user, token, loading: authLoading } = useAuth();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Protección de acceso: si no hay sesión, redirigir a login.
    if (!authLoading && !user) {
      window.location.href = "/login";
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (token && id) {
      setLoading(true);
      Promise.all([
        api.getSubject(token, id),
        api.getTasks(token, id),
        api.getAbsences(token, id),
      ])
        .then(([s, t, a]) => {
          setSubject(s);
          setTasks(t);
          setAbsences(a);
        })
        .catch((err) => {
          console.error(err);
          setError(err.message || "No se pudo cargar la materia.");
        })
        .finally(() => setLoading(false));
    }
  }, [token, id]);

  if (authLoading || loading) {
    return (
      <div className="oat-spinner-wrapper">
        <div className="oat-spinner" />
        <span>Cargando...</span>
      </div>
    );
  }

  if (error) return <div className="oat-text--danger">Error: {error}</div>;
  if (!subject)
    return <div className="oat-text--secondary">Materia no encontrada.</div>;

  // Cálculo de métricas reales de asistencia
  const totalAbsenceValue = absences.reduce(
    (sum, a) => sum + a.calculated_value,
    0,
  );
  const attendancePercentage =
    subject.total_classes > 0
      ? Math.max(
          0,
          Math.round(
            ((subject.total_classes - totalAbsenceValue) /
              subject.total_classes) *
              100,
          ),
        )
      : 100;

  // Lógica de semáforo basada en el porcentaje de asistencia (riesgo de libre)
  // Límite usual 75-80% para aprobación
  const riskVariant =
    attendancePercentage < 75
      ? "danger"
      : attendancePercentage < 85
        ? "warning"
        : "success";

  return (
    <div className="oat-detail-container">
      <header
        className="oat-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          borderBottom: "1px solid var(--oat-border)",
          paddingBottom: "1rem",
        }}
      >
        <h1 className="oat-title">{subject.name}</h1>
        <StatusBadge variant={riskVariant}>
          Riesgo:{" "}
          {riskVariant === "success"
            ? "Bajo"
            : riskVariant === "warning"
              ? "Medio"
              : "Alto"}
        </StatusBadge>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <section className="oat-card">
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
            Métricas de Asistencia
          </h2>
          <div style={{ textAlign: "center", padding: "1rem" }}>
            <span
              style={{
                fontSize: "3rem",
                fontWeight: "bold",
                color: "var(--oat-primary)",
              }}
            >
              {attendancePercentage}%
            </span>
            <p className="oat-text-secondary">Asistencia actual</p>
          </div>
          <div
            style={{
              marginTop: "1rem",
              borderTop: "1px solid var(--oat-border)",
              paddingTop: "1rem",
            }}
          >
            <p style={{ margin: "0.5rem 0" }}>
              Clases totales: <strong>{subject.total_classes}</strong>
            </p>
            <p style={{ margin: "0.5rem 0" }}>
              Inasistencias totales:{" "}
              <strong style={{ color: "var(--oat-danger)" }}>
                {totalAbsenceValue}
              </strong>
            </p>
          </div>
        </section>

        <section className="oat-card">
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
            Historial de Tareas
          </h2>
          {tasks.length === 0 ? (
            <p className="oat-text-secondary">No hay tareas asociadas.</p>
          ) : (
            <ul className="oat-list" style={{ listStyle: "none", padding: 0 }}>
              {tasks.map((t) => (
                <li
                  key={t.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.75rem 0",
                    borderBottom: "1px solid var(--oat-border)",
                  }}
                >
                  <a
                    href={`/tasks/${t.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {t.title}
                  </a>
                  <StatusBadge
                    variant={t.status === "done" ? "success" : "warning"}
                  >
                    {t.status === "done" ? "Ok" : "Pendiente"}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <button
          onClick={() => (window.location.href = "/subjects")}
          className="oat-btn oat-btn-outline"
        >
          ← Volver a Materias
        </button>
      </div>
    </div>
  );
};
