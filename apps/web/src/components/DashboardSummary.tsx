import React, { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { StatusBadge } from "./StatusBadge";
import { useTasks, useAtRiskSubjects, useUpdateTask } from "../hooks/useDashboardQueries";

const BentoLink: React.FC<{
  href: string;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}> = ({ href, children, className = "", dark }) => (
  <a
    href={href}
    className={`bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm no-underline text-inherit block cursor-pointer transition-all duration-150 hover:-translate-y-1 hover:shadow-lg ${
      dark ? "bg-theme-primary border-transparent text-theme-bg **:text-theme-bg" : ""
    } ${className}`}
  >
    {children}
  </a>
);

export const DashboardSummary: React.FC = () => {
  const { user, token, loading: authLoading } = useAuth();
  const { data: atRisk = [], isLoading: loadingAtRisk } = useAtRiskSubjects();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks({ includePlanner: true });
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
    if (typeof window !== "undefined" && !authLoading && !user) window.location.replace("/login");
  }, [user, authLoading]);

  if (authLoading || (loading && token)) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 p-16 text-theme-text-muted text-sm"
        aria-busy="true"
        aria-label="Cargando resumen del dashboard"
      ></div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-[1100px] mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-bold m-0">Hola, {user.name.split(" ")[0]} 👋</h1>
        <p className="text-theme-text-muted">Este es el estado de tu semestre académico.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[minmax(160px,auto)] gap-5">
        {/* CARD 1: Alertas */}
        <BentoLink
          href="/subjects"
          className={`${atRisk.length > 0 ? "row-span-2 border-theme-danger bg-theme-danger-light" : ""}`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold m-0">⚠️ Alertas</h2>
            <StatusBadge variant={atRisk.length > 0 ? "danger" : "success"}>
              {atRisk.length} UC
            </StatusBadge>
          </div>
          {atRisk.length === 0 ? (
            <p className="text-theme-text-muted">Todo bajo control. No hay riesgos detectados.</p>
          ) : (
            <ul className="list-none p-0 m-0">
              {atRisk.map((s) => (
                <li
                  key={s.id}
                  className="p-3 bg-white/50 rounded-lg mb-2 flex flex-col gap-0.5 border border-theme-danger"
                >
                  <span className="font-bold text-theme-danger">{s.name}</span>
                  <small className="text-theme-text-muted">Superó el límite de inasistencias</small>
                </li>
              ))}
            </ul>
          )}
          <span className="block mt-4 text-xs text-theme-text-muted text-right" aria-hidden="true">
            Ver UC →
          </span>
        </BentoLink>

        {/* CARD 2: Próximas Tareas */}
        <div
          className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm no-underline text-inherit block cursor-pointer transition-all duration-150 hover:-translate-y-1 hover:shadow-lg"
          onClick={() => (window.location.href = "/tasks")}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold m-0">📅 Próximas Tareas</h2>
          </div>

          {upcomingTasks.length === 0 ? (
            <p className="text-theme-text-muted">Sin tareas pendientes.</p>
          ) : (
            <ul className="list-none p-0 m-0 mt-2">
              {upcomingTasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-start gap-3 py-3 border-b border-theme-border last:border-b-0 group"
                >
                  <button
                    onClick={(e) => handleToggleTask(t, e)}
                    aria-label="Alternar estado de la tarea"
                    className={`w-6 h-6 min-w-6 min-h-6 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer p-0 z-10 ${
                      t.status === "done"
                        ? "border-theme-success bg-theme-success"
                        : "border-theme-border bg-transparent hover:border-theme-primary"
                    }`}
                  >
                    {t.status === "done" && (
                      <span className="text-white text-sm leading-none">✓</span>
                    )}
                  </button>
                  <a
                    href={`/tasks/${t.slug || t.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="no-underline text-inherit flex-1 hover:text-theme-primary transition-colors"
                  >
                    <div
                      className={`font-semibold text-sm ${t.status === "done" ? "line-through text-theme-text-muted" : ""}`}
                    >
                      {t.title}
                    </div>
                    <small className="text-theme-text-muted">
                      Vence:{" "}
                      {t.due_date instanceof Date
                        ? t.due_date.toLocaleDateString("es-UY")
                        : new Date(t.due_date).toLocaleDateString("es-UY")}
                    </small>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <div className="block mt-4 text-xs text-theme-text-muted text-right no-underline group-hover:underline">
            Ver todas →
          </div>
        </div>

        {/* CARD 3: Acceso Rápido Práctica */}
        <BentoLink href="/journal" dark>
          <div className="flex flex-col justify-center items-center h-full min-h-[120px] gap-2">
            <span className="text-4xl" aria-hidden="true">
              ✍️
            </span>
            <span className="font-bold text-lg">Nueva Práctica</span>
          </div>
        </BentoLink>

        {/* CARD 4: Progreso General */}
        <BentoLink href="/analytics">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold m-0">Progreso General</h2>
          </div>
          <div className="h-2 bg-theme-border rounded overflow-hidden" aria-hidden="true">
            <div
              className="h-full rounded transition-[width] duration-400"
              style={{
                width: `${progressPercent}%`,
                backgroundColor:
                  progressPercent === 100
                    ? "var(--theme-success)"
                    : progressPercent >= 50
                      ? "var(--theme-primary)"
                      : "var(--theme-warning)",
              }}
            />
          </div>
          <p className="text-theme-text-muted mt-3 text-sm">
            {totalTasks === 0 ? (
              "No hay tareas registradas aún."
            ) : (
              <>
                <strong>{doneTasks}</strong> de <strong>{totalTasks}</strong> tareas completadas (
                {progressPercent}%)
              </>
            )}
          </p>
          <span className="block mt-4 text-xs text-theme-text-muted text-right" aria-hidden="true">
            Ver analíticas →
          </span>
        </BentoLink>

        {/* CARD 5: Integración Schoology */}
        <BentoLink href="/schoology" className="col-span-full mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold m-0">🔗 Integración Schoology</h2>
          </div>
          <p className="text-theme-text-muted text-sm">
            Administra la cuenta vinculada de Webcal/iCal para tus tareas académicas.
          </p>
          <span className="block mt-4 text-xs text-theme-text-muted text-right" aria-hidden="true">
            Configurar →
          </span>
        </BentoLink>
      </div>
    </div>
  );
};
