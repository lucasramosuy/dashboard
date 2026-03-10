import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/Button";
import { getChartTheme } from "../../lib/chart-theme";
import { useSubjects, useTasks, useAllAbsences } from "../../hooks/useDashboardQueries";
import { AnalyticsSkeleton } from "../ui/Skeleton";
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
  const { loading: authLoading } = useAuth();
  const { data: subjects = [], isLoading: loadingSubjects } = useSubjects();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: absences = [], isLoading: loadingAbsences } = useAllAbsences();
  const loading = loadingSubjects || loadingTasks || loadingAbsences;

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Detectar el modo oscuro desde el atributo html
    const checkTheme = () => {
      setIsDark(document.body.dataset.theme === "dark");
    };
    checkTheme();
    const observer = new window.MutationObserver(checkTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const theme = getChartTheme(isDark);

  if (authLoading || loading) {
    return <AnalyticsSkeleton />;
  }

  const taskStatusData = React.useMemo(() => {
    let done = 0;
    let inProgress = 0;
    let todo = 0;

    for (const t of tasks) {
      if (t.status === "done") done++;
      else if (t.status === "in-progress") inProgress++;
      else if (t.status === "todo") todo++;
    }

    return [
      { name: "Completadas", value: done, fill: theme.data.success },
      { name: "En Proceso", value: inProgress, fill: theme.data.info },
      { name: "Pendientes", value: todo, fill: theme.data.warning },
    ].filter((d) => d.value > 0);
  }, [tasks, theme]);

  const attendanceData = React.useMemo(() => {
    const absencesBySubject = new Map<string, number>();
    for (const a of absences) {
      if (a.subject_id) {
        const current = absencesBySubject.get(a.subject_id) || 0;
        absencesBySubject.set(a.subject_id, current + (a.calculated_value || 0));
      }
    }

    return subjects.map((s) => {
      const totalAbsenceValue = absencesBySubject.get(s.id) || 0;
      const percentage =
        s.total_classes > 0
          ? Math.max(0, Math.round(((s.total_classes - totalAbsenceValue) / s.total_classes) * 100))
          : 100;
      return { name: s.name, asistencia: percentage };
    });
  }, [subjects, absences]);

  return (
    <div>
      <header className="mb-10">
        <h1 className="m-0 text-theme-text">Analíticas Académicas</h1>
        <p className="text-theme-text-muted">Resumen visual de tu progreso y asistencia.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-8">
        <section className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl mb-6 text-center text-theme-text">Distribución de Tareas</h2>
          <div className="h-75 min-w-0" aria-label="Gráfico circular de distribución de tareas">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  stroke={theme.tooltip.backgroundColor}
                  strokeWidth={2}
                  label={{ fill: theme.textColor, fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.tooltip.backgroundColor,
                    border: `1px solid ${theme.tooltip.borderColor}`,
                    borderRadius: "8px",
                    color: theme.tooltip.color,
                  }}
                  itemStyle={{ color: theme.tooltip.color }}
                />
                <Legend
                  wrapperStyle={{ color: theme.textColor, fontSize: "13px", paddingTop: "10px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl mb-6 text-center text-theme-text">Asistencia por UC (%)</h2>
          <div className="h-75 min-w-0" aria-label="Gráfico de barras de asistencia por UC">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: theme.textColor, fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: theme.textColor, fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: theme.gridColor }}
                  contentStyle={{
                    backgroundColor: theme.tooltip.backgroundColor,
                    border: `1px solid ${theme.tooltip.borderColor}`,
                    borderRadius: "8px",
                    color: theme.tooltip.color,
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="asistencia" fill={theme.data.info} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-theme-text-muted text-center mt-4">
            Un porcentaje inferior al 75% indica riesgo de quedar libre.
          </p>
        </section>
      </div>

      <div className="mt-10 text-right">
        <Button
          variant="secondary"
          onClick={() => (window.location.href = "/")}
          aria-label="Volver al Dashboard"
        >
          Volver al Dashboard
        </Button>
      </div>
    </div>
  );
};
