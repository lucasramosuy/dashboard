import React, { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { StatusBadge } from "./StatusBadge";
import { useTasks, useAtRiskSubjects, useUpdateTask } from "../hooks/useDashboardQueries";

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

  // React Query Hooks (Data Fetching Sólido)
  const { data: atRisk = [], isLoading: loadingAtRisk } = useAtRiskSubjects();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const updateTask = useUpdateTask();

  const handleToggleTask = (task: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateTask.mutate({
      id: task.id,
      data: { status: task.status === "done" ? "todo" : "done" },
    });
  };

  const loading = loadingAtRisk || loadingTasks;

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const upcomingTasks = [...tasks]
    .filter((t) => t.status !== "done")
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3);

  useEffect(() => {
    if (typeof window !== "undefined" && !authLoading && !user) {
      window.location.replace("/login");
    }
  }, [user, authLoading]);

  // Si auth está cargando, o las queries iniciales, mostramos spinner
  if (authLoading || (loading && token)) {
    return (
      <div
        className="oat-spinner-wrapper"
        aria-busy="true"
        aria-label="Cargando resumen del dashboard"
      ></div>
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
              {atRisk.length} UC
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
          <span className="bento-link-hint" aria-hidden="true">
            Ver UC →
          </span>
        </BentoLink>

        {/* CARD 2: Próximas Tareas */}
        <div className="oat-card" style={{ display: "flex", flexDirection: "column" }}>
          <a
            href="/tasks"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "block",
              marginBottom: "auto",
            }}
          >
            <div className="bento-card-header">
              <h2 className="bento-card-title">📅 Próximas Tareas</h2>
            </div>
          </a>
          {upcomingTasks.length === 0 ? (
            <p className="oat-text-secondary">Sin tareas pendientes.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, marginTop: "0.5rem" }}>
              {upcomingTasks.map((t) => (
                <li key={t.id} className="task-preview-item" style={{ padding: "0.75rem 0" }}>
                  <div
                    style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", flex: 1 }}
                  >
                    <button
                      onClick={(e) => handleToggleTask(t, e)}
                      aria-label="Alternar estado de la tarea"
                      style={{
                        padding: 0,
                        width: "24px",
                        height: "24px",
                        minWidth: "24px",
                        minHeight: "24px",
                        marginTop: "2px",
                        borderRadius: "50%",
                        border: `2px solid ${t.status === "done" ? "var(--oat-success)" : "var(--oat-border)"}`,
                        background: t.status === "done" ? "var(--oat-success)" : "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {t.status === "done" && (
                        <span style={{ color: "white", fontSize: "14px", lineHeight: 1 }}>✓</span>
                      )}
                    </button>
                    <a
                      href={`/tasks`}
                      style={{ textDecoration: "none", color: "inherit", flex: 1 }}
                    >
                      <div
                        className="oat-text-primary"
                        style={{
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          textDecoration: t.status === "done" ? "line-through" : "none",
                          color: t.status === "done" ? "var(--oat-text-muted)" : "inherit",
                        }}
                      >
                        {t.title}
                      </div>
                      <small className="oat-text-secondary">
                        Vence:{" "}
                        {t.due_date instanceof Date
                          ? t.due_date.toLocaleDateString("es-UY")
                          : new Date(t.due_date).toLocaleDateString("es-UY")}
                      </small>
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <a
            href="/tasks"
            className="bento-link-hint"
            style={{
              textDecoration: "none",
              color: "var(--oat-text-muted)",
              marginTop: "1rem",
              display: "block",
            }}
          >
            Ver tareas →
          </a>
        </div>

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
            <span style={{ fontSize: "2.5rem" }} aria-hidden="true">
              ✍️
            </span>
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
          <div className="progress-bar-track" aria-hidden="true">
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
          <span className="bento-link-hint" aria-hidden="true">
            Ver analíticas →
          </span>
        </BentoLink>

        {/* CARD 5: Integración Schoology → /schoology */}
        <BentoLink href="/schoology" style={{ gridColumn: "1 / -1", marginTop: "1rem" }}>
          <div className="bento-card-header">
            <h2 className="bento-card-title">🔗 Integración Schoology</h2>
          </div>
          <p className="oat-text-secondary" style={{ fontSize: "0.875rem" }}>
            Administra la cuenta vinculada de Webcal/iCal para tus tareas académicas.
          </p>
          <span className="bento-link-hint" aria-hidden="true" style={{ marginTop: "1rem" }}>
            Configurar →
          </span>
        </BentoLink>
      </div>
    </div>
  );
};
