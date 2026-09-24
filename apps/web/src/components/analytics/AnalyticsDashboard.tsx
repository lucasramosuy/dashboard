import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getChartTheme } from "../../lib/chart-theme";
import { useSubjects, useTasks, useAllAbsences } from "../../hooks/useDashboardQueries";
import { AnalyticsSkeleton } from "../ui/Skeleton";
import { PageHeader, Card, StatTile } from "../ui/PageHeader";
import { attendanceInfo, average, toLocalDay, daysUntil } from "../../lib/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  Cell,
  Legend,
} from "recharts";

function mondayOf(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay() || 7;
  x.setDate(x.getDate() - (day - 1));
  return x;
}

export const AnalyticsDashboard: React.FC = () => {
  const { loading: authLoading } = useAuth();
  const { data: subjects = [], isLoading: l1 } = useSubjects();
  const { data: tasks = [], isLoading: l2 } = useTasks();
  const { data: absences = [], isLoading: l3 } = useAllAbsences();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.dataset.theme === "dark");
    check();
    const obs = new window.MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  const theme = getChartTheme(isDark);
  if (authLoading || l1 || l2 || l3) return <AnalyticsSkeleton />;

  const tooltipStyle = {
    backgroundColor: theme.tooltip.backgroundColor,
    border: `1px solid ${theme.tooltip.borderColor}`,
    borderRadius: 8,
    color: theme.tooltip.color,
    fontSize: 13,
  };
  const axis = { fill: theme.textColor, fontSize: 12 };

  const attendanceData = subjects.map((s) => {
    const v = absences.filter((a) => a.subject_id === s.id).reduce((sum, a) => sum + (a.calculated_value || 0), 0);
    const info = attendanceInfo(s.total_classes, v);
    return { name: s.name, asistencia: info.percentage, status: info.status };
  });

  const gradesData = subjects
    .map((s) => ({
      name: s.name,
      promedio: average(tasks.filter((t) => t.subject_id === s.id && t.grade != null).map((t) => t.grade as number)),
    }))
    .filter((d) => d.promedio != null);

  // Entregas por semana (últimas 4 + próximas 4), según fecha de vencimiento
  const thisMonday = mondayOf(new Date());
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(thisMonday);
    start.setDate(start.getDate() + (i - 4) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const inWeek = tasks.filter((t) => {
      const d = toLocalDay(t.due_date);
      return d >= start && d < end;
    });
    return {
      name: `${start.getDate()}/${start.getMonth() + 1}`,
      Hechas: inWeek.filter((t) => t.status === "done").length,
      Pendientes: inWeek.filter((t) => t.status !== "done").length,
    };
  });

  const done = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter((t) => t.status !== "done" && daysUntil(t.due_date) < 0).length;
  const allGrades = tasks.map((t) => t.grade).filter((g): g is number => g != null);
  const avgAttendance = attendanceData.length ? Math.round(attendanceData.reduce((s, d) => s + d.asistencia, 0) / attendanceData.length) : null;

  return (
    <div>
      <PageHeader title="Analíticas" subtitle="Tu progreso, notas y asistencia" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatTile label="Completadas" value={`${done}/${tasks.length}`} hint={tasks.length ? `${Math.round((done / tasks.length) * 100)}% del total` : undefined} />
        <StatTile label="Vencidas" value={overdue} tone={overdue ? "danger" : "default"} />
        <StatTile label="Promedio general" value={average(allGrades) ?? "—"} hint={`${allGrades.length} notas`} />
        <StatTile label="Asistencia media" value={avgAttendance != null ? `${avgAttendance}%` : "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card title="Asistencia por UC">
          <div className="h-64" aria-label="Gráfico de asistencia por UC">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={attendanceData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} stroke={theme.gridColor} />
                <XAxis type="number" domain={[0, 100]} tick={axis} axisLine={false} tickLine={false} unit="%" />
                <YAxis type="category" dataKey="name" width={120} tick={axis} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: theme.gridColor }} formatter={(v) => [`${v}%`, "Asistencia"]} />
                <ReferenceLine x={75} stroke={theme.data.warning} strokeDasharray="4 4" label={{ value: "75%", fill: theme.data.warning, fontSize: 11, position: "top" }} />
                <Bar dataKey="asistencia" radius={[0, 6, 6, 0]} barSize={18}>
                  {attendanceData.map((d) => (
                    <Cell key={d.name} fill={d.status === "danger" ? "#dc2626" : d.status === "warning" ? theme.data.warning : theme.data.success} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="m-0 mt-2 text-xs text-theme-text-muted">Debajo de 75% quedás libre (reglamento CFE).</p>
        </Card>

        <Card title="Promedio por UC">
          {gradesData.length === 0 ? (
            <p className="m-0 text-sm text-theme-text-muted">Cargá notas en tus tareas para ver promedios.</p>
          ) : (
            <div className="h-64" aria-label="Gráfico de promedio por UC">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={gradesData} margin={{ right: 8 }}>
                  <CartesianGrid vertical={false} stroke={theme.gridColor} />
                  <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} interval={0} />
                  <YAxis domain={[0, 12]} ticks={[0, 3, 6, 9, 12]} tick={axis} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: theme.gridColor }} />
                  <Bar dataKey="promedio" fill={theme.colors[0]} radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Entregas por semana" className="lg:col-span-2">
          <div className="h-60" aria-label="Gráfico de entregas por semana">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={weeks}>
                <CartesianGrid vertical={false} stroke={theme.gridColor} />
                <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} width={24} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: theme.gridColor }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Hechas" stackId="a" fill={theme.data.success} />
                <Bar dataKey="Pendientes" stackId="a" fill={theme.data.warning} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="m-0 mt-2 text-xs text-theme-text-muted">Semanas desde el lunes; incluye las 4 anteriores y las 4 que vienen.</p>
        </Card>
      </div>
    </div>
  );
};
