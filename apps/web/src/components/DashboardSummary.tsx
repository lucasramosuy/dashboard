import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { StatusBadge } from "./StatusBadge";
import type { Subject, Task } from "@dashboard/shared-types";

// Wrapper clickeable para tarjetas bento
const BentoLink: React.FC<{
  href: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  dark?: boolean;
}> = ({ href, children, style, dark }) => (
  <a
    href={href}
    className={`oat-card bento-link${dark ? " bento-link--dark" : ""}`}
    style={{ textDecoration: "none", color: "inherit", display: "block", ...style }}
  >
    {children}
  </a>
);

export const DashboardSummary: React.FC = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [atRisk, setAtRisk] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const upcomingTasks = [...tasks]
    .filter((t) => t.status !== "done")
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3);

  useEffect(() => {
    if (!authLoading && !user) window.location.href = "/login";
  }, [user, authLoading]);

  useEffect(() => {
    if (token) {
      setLoading(true);
      Promise.all([api.getAtRiskSubjects(token), api.getTasks(token)])
        .then(([riskData, taskData]) => {
          setAtRisk(riskData);
          setTasks(taskData);
        })
        .catch(() => {
          // API falló — no bloqueamos la UI
        })
        .finally(() => setLoading(false));
    } else if (!authLoading) {
      // Auth terminó pero no hay token → redirigir
      setLoading(false);
    }
  }, [token, authLoading]); // ← agregar authLoading a las deps

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
    <div className="dashboard-wrapper">
      <header className="dashboard-header">
        <h1 className="oat-text-bold" style={{ fontSize: "2.5rem", margin: 0 }}>
          Hola, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="oat-text-secondary">Este es el estado de tu semestre académico.</p>
      </header>

      <div className="bento-grid">
        {/* CARD 1: Alertas → /subjects */}
        <BentoLink
          href="/subjects"
          style={{
            gridRow: atRisk.length > 0 ? "span 2" : "span 1",
            borderColor: atRisk.length > 0 ? "var(--oat-danger)" : "var(--oat-border)",
            backgroundColor: atRisk.length > 0 ? "var(--oat-danger-light)" : "var(--oat-card-bg)",
          }}
        >
          <div className="bento-card-header">
            <h2 className="bento-card-title">⚠️ Alertas</h2>
            <StatusBadge variant={atRisk.length > 0 ? "danger" : "success"}>
              {atRisk.length} materias
            </StatusBadge>
          </div>
          {atRisk.length === 0 ? (
            <p className="oat-text-secondary">Todo bajo control. No hay riesgos detectados.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {atRisk.map((s) => (
                <li key={s.id} className="at-risk-item">
                  <span className="oat-text-bold" style={{ color: "var(--oat-danger)" }}>
                    {s.name}
                  </span>
                  <small className="oat-text-secondary">Superó el límite de inasistencias</small>
                </li>
              ))}
            </ul>
          )}
          <span className="bento-link-hint">Ver materias →</span>
        </BentoLink>

        {/* CARD 2: Próximas Tareas → /tasks */}
        <BentoLink href="/tasks">
          <div className="bento-card-header">
            <h2 className="bento-card-title">📅 Próximas Tareas</h2>
          </div>
          {upcomingTasks.length === 0 ? (
            <p className="oat-text-secondary">Sin tareas pendientes.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {upcomingTasks.map((t) => (
                <li key={t.id} className="task-preview-item">
                  <div>
                    <div
                      className="oat-text-primary"
                      style={{ fontWeight: 600, fontSize: "0.875rem" }}
                    >
                      {t.title}
                    </div>
                    <small className="oat-text-secondary">
                      Vence:{" "}
                      {t.due_date instanceof Date
                        ? t.due_date.toLocaleDateString("es-UY")
                        : new Date(t.due_date).toLocaleDateString("es-UY")}
                    </small>
                  </div>
                  <StatusBadge variant="warning">Pendiente</StatusBadge>
                </li>
              ))}
            </ul>
          )}
          <span className="bento-link-hint">Ver tareas →</span>
        </BentoLink>

        {/* CARD 3: Acceso Rápido Práctica → /journal */}
        <BentoLink href="/journal" dark>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              minHeight: "120px",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "2.5rem" }}>✍️</span>
            <span className="oat-text-bold" style={{ fontSize: "1.1rem" }}>
              Nueva Práctica
            </span>
          </div>
        </BentoLink>

        {/* CARD 4: Progreso General → /analytics */}
        <BentoLink href="/analytics">
          <div className="bento-card-header">
            <h2 className="bento-card-title">Progreso General</h2>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{
                width: `${progressPercent}%`,
                backgroundColor:
                  progressPercent === 100
                    ? "var(--oat-success)"
                    : progressPercent >= 50
                      ? "var(--oat-primary)"
                      : "var(--oat-warning)",
              }}
            />
          </div>
          <p className="oat-text-secondary" style={{ marginTop: "0.75rem", fontSize: "0.875rem" }}>
            {totalTasks === 0 ? (
              "No hay tareas registradas aún."
            ) : (
              <>
                <strong>{doneTasks}</strong> de <strong>{totalTasks}</strong> tareas completadas (
                {progressPercent}%)
              </>
            )}
          </p>
          <span className="bento-link-hint">Ver analíticas →</span>
        </BentoLink>
      </div>
    </div>
  );
};
