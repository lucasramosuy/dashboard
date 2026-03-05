import React, { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSubjects, useTasks, useAllAbsences } from "../hooks/useDashboardQueries";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export const AnalyticsDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: subjects = [], isLoading: loadingSubjects } = useSubjects();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: absences = [], isLoading: loadingAbsences } = useAllAbsences();
  const loading = loadingSubjects || loadingTasks || loadingAbsences;

  useEffect(() => {
    if (typeof window !== "undefined" && !authLoading && !user) window.location.replace("/login");
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 p-16 text-theme-text-muted text-sm"
        aria-busy="true"
        aria-label="Cargando analíticas"
      ></div>
    );
  }

  const taskStatusData = [
    {
      name: "Completadas",
      value: tasks.filter((t) => t.status === "done").length,
      fill: "#10b981",
    },
    {
      name: "En Proceso",
      value: tasks.filter((t) => t.status === "in-progress").length,
      fill: "#3b82f6",
    },
    { name: "Pendientes", value: tasks.filter((t) => t.status === "todo").length, fill: "#f59e0b" },
  ].filter((d) => d.value > 0);

  const attendanceData = subjects.map((s) => {
    const subjectAbsences = absences.filter((a) => a.subject_id === s.id);
    const totalAbsenceValue = subjectAbsences.reduce(
      (sum, a) => sum + (a.calculated_value || 0),
      0,
    );
    const percentage =
      s.total_classes > 0
        ? Math.max(0, Math.round(((s.total_classes - totalAbsenceValue) / s.total_classes) * 100))
        : 100;
    return { name: s.name, asistencia: percentage };
  });

  return (
    <div>
      <header className="mb-10">
        <h1 className="m-0 text-theme-text">Analíticas Académicas</h1>
        <p className="text-theme-text-muted">Resumen visual de tu progreso y asistencia.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-8">
        <section className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl mb-6 text-center text-theme-text">Distribución de Tareas</h2>
          <div
            className="h-[300px] min-w-0"
            aria-label="Gráfico circular de distribución de tareas"
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl mb-6 text-center text-theme-text">Asistencia por UC (%)</h2>
          <div className="h-[300px] min-w-0" aria-label="Gráfico de barras de asistencia por UC">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={attendanceData}>
                <XAxis dataKey="name" padding={{ left: 0, right: 0 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="asistencia" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-theme-text-muted text-center mt-4">
            Un porcentaje inferior al 75% indica riesgo de quedar libre.
          </p>
        </section>
      </div>

      <div className="mt-10 text-right">
        <button
          onClick={() => (window.location.href = "/")}
          className="px-5 py-2.5 rounded-lg font-semibold border border-theme-border bg-transparent text-theme-text hover:bg-theme-bg hover:border-theme-accent cursor-pointer transition-all duration-150"
          aria-label="Volver al Dashboard"
        >
          Volver al Dashboard
        </button>
      </div>
    </div>
  );
};
