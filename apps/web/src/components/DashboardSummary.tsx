import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { StatusBadge } from "./StatusBadge";
import type { Subject, Task } from "@dashboard/shared-types";

export const DashboardSummary: React.FC = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [atRisk, setAtRisk] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const progressPercent =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/login";
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (token) {
      setLoading(true);
      Promise.all([api.getAtRiskSubjects(token), api.getTasks(token)])
        .then(([riskData, taskData]) => {
          setAtRisk(riskData);
          setTasks(taskData);
        })
        .finally(() => setLoading(false));
    }
  }, [token]);

  if (authLoading || loading) {
    return (
      <div className="oat-spinner-wrapper">
        <div className="oat-spinner" />
        <span>Cargando...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ marginBottom: "2.5rem" }}>
        <h1 className="oat-text-bold" style={{ fontSize: "2.5rem", margin: 0 }}>
          Hola, {user.name.split(" ")[0]}
        </h1>
        <p className="oat-text-secondary">
          Este es el estado de tu semestre académico.
        </p>
      </header>

      {/* Bento Grid Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gridAutoRows: "minmax(160px, auto)",
          gap: "1.5rem",
        }}
      >
        {/* CARD 1: Materias en Riesgo (Ocupa 2 filas si hay datos) */}
        <section
          className="oat-card"
          style={{
            gridRow: atRisk.length > 0 ? "span 2" : "span 1",
            borderColor:
              atRisk.length > 0 ? "var(--oat-danger)" : "var(--oat-border)",
            backgroundColor:
              atRisk.length > 0
                ? "var(--oat-danger-light)"
                : "var(--oat-card-bg)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>⚠️ Alertas</h2>
            <StatusBadge variant={atRisk.length > 0 ? "danger" : "success"}>
              {atRisk.length} materias
            </StatusBadge>
          </div>

          {atRisk.length === 0 ? (
            <p className="oat-text-secondary">
              Todo bajo control. No hay riesgos detectados.
            </p>
          ) : (
            <ul className="oat-list" style={{ listStyle: "none", padding: 0 }}>
              {atRisk.map((s) => (
                <li
                  key={s.id}
                  style={{
                    padding: "1rem",
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                    borderRadius: "12px",
                    marginBottom: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                    border: "1px solid var(--oat-danger)",
                  }}
                >
                  <span
                    className="oat-text-bold"
                    style={{ color: "var(--oat-danger)" }}
                  >
                    {s.name}
                  </span>
                  <small className="oat-text-secondary">
                    Superó el límite de inasistencias
                  </small>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* CARD 2: Próximas Tareas (Más ancha en desktop) */}
        <section className="oat-card" style={{ gridColumn: "span 1" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>
            📅 Próximas Tareas
          </h2>
          {tasks.length === 0 ? (
            <p className="oat-text-secondary">
              Sin tareas pendientes para hoy.
            </p>
          ) : (
            <ul className="oat-list" style={{ listStyle: "none", padding: 0 }}>
              {tasks.slice(0, 3).map((t) => (
                <li
                  key={t.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem 0",
                    borderBottom: "1px solid var(--oat-border)",
                  }}
                >
                  <div>
                    <div
                      className="oat-text-primary"
                      style={{ fontWeight: 600 }}
                    >
                      {t.title}
                    </div>
                    <small className="oat-text-secondary">
                      {t.due_date instanceof Date
                        ? t.due_date.toLocaleDateString()
                        : new Date(t.due_date).toLocaleDateString()}
                    </small>
                  </div>
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

        {/* CARD 3: Acceso Rápido Diario (Estética Bento pequeña) */}
        <section
          className="oat-card"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            backgroundColor: "var(--oat-primary)",
            color: "var(--oat-bg)",
            border: "none",
          }}
          onClick={() => (window.location.href = "/journal")}
        >
          <span style={{ fontSize: "2rem" }}>✍️</span>
          <span className="oat-text-bold" style={{ marginTop: "0.5rem" }}>
            Nuevo Diario
          </span>
        </section>

        {/* CARD 4: Resumen de Progreso (Ancha) */}
        <section className="oat-card" style={{ gridColumn: "span 1" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
            Progreso General
          </h2>
          <div
            style={{
              height: "8px",
              backgroundColor: "var(--oat-border)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                backgroundColor:
                  progressPercent === 100
                    ? "var(--oat-success)"
                    : progressPercent >= 50
                      ? "var(--oat-primary)"
                      : "var(--oat-warning)",
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <p
            className="oat-text-secondary"
            style={{ marginTop: "0.75rem", fontSize: "0.875rem" }}
          >
            {totalTasks === 0 ? (
              "No hay tareas registradas aún."
            ) : (
              <>
                Has completado{" "}
                <strong>
                  {doneTasks} de {totalTasks}
                </strong>{" "}
                tareas ({progressPercent}%)
              </>
            )}
          </p>
        </section>
      </div>
    </div>
  );
};
