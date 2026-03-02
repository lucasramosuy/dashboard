import React, { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSubjects, useTasks, useAllAbsences } from "../hooks/useDashboardQueries";
import {
  PieChart,
  Pie,
  Cell,
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

  // React Query Hooks
  const { data: subjects = [], isLoading: loadingSubjects } = useSubjects();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: absences = [], isLoading: loadingAbsences } = useAllAbsences();

  const loading = loadingSubjects || loadingTasks || loadingAbsences;

  useEffect(() => {
    if (typeof window !== "undefined" && !authLoading && !user) {
      window.location.replace("/login");
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="oat-spinner-wrapper" aria-busy="true" aria-label="Cargando analíticas"></div>
    );
  }

  // Datos para Pie Chart (Cumplimiento de Tareas)
  const taskStatusData = [
    {
      name: "Completadas",
      value: tasks.filter((t) => t.status === "done").length,
      color: "#10b981",
    },
    {
      name: "En Proceso",
      value: tasks.filter((t) => t.status === "in-progress").length,
      color: "#3b82f6",
    },
    {
      name: "Pendientes",
      value: tasks.filter((t) => t.status === "todo").length,
      color: "#f59e0b",
    },
  ].filter((d) => d.value > 0);

  // Datos para Bar Chart (Asistencia por UC - Porcentaje Real)
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

    return {
      name: s.name,
      asistencia: percentage,
    };
  });

  return (
    <div>
      <header style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ margin: 0 }}>Analíticas Académicas</h1>
        <p className="oat-text-secondary">Resumen visual de tu progreso y asistencia.</p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "2rem",
        }}
      >
        {/* Gráfico 1: Cumplimiento de Tareas */}
        <section className="oat-card">
          <h2
            style={{
              fontSize: "1.25rem",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}
          >
            Distribución de Tareas
          </h2>
          <div style={{ height: "300px" }} aria-label="Gráfico circular de distribución de tareas">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Gráfico 2: Asistencia por UC (Porcentaje Real) */}
        <section className="oat-card">
          <h2
            style={{
              fontSize: "1.25rem",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}
          >
            Asistencia por UC (%)
          </h2>
          <div style={{ height: "300px" }} aria-label="Gráfico de barras de asistencia por UC">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <XAxis dataKey="name" padding={{ left: 0, right: 0 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="asistencia" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p
            style={{
              fontSize: "0.8rem",
              color: "#888",
              textAlign: "center",
              marginTop: "1rem",
            }}
          >
            Un porcentaje inferior al 75% indica riesgo de quedar libre.
          </p>
        </section>
      </div>

      <div style={{ marginTop: "2.5rem", textAlign: "right" }}>
        <button
          onClick={() => (window.location.href = "/")}
          className="oat-btn oat-btn-outline"
          aria-label="Volver al Dashboard"
        >
          Volver al Dashboard
        </button>
      </div>
    </div>
  );
};
