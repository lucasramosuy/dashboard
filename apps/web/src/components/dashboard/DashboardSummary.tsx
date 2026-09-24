import React from "react";
import { CalendarDays, Check, PenLine, ArrowRight } from "lucide-react";
import type { Task } from "@dashboard/shared-types";
import { useAuth } from "../../contexts/AuthContext";
import {
  useTasks,
  useSubjects,
  useAllAbsences,
  useJournals,
  useIcalEvents,
  useUpdateTask,
} from "../../hooks/useDashboardQueries";
import { PageHeader, Card, StatTile, ProgressBar } from "../ui/PageHeader";
import {
  attendanceInfo,
  remainingLabel,
  average,
  daysUntil,
  dueLabel,
  formatDayLong,
  toLocalDay,
  todayKey,
  dayKey,
} from "../../lib/format";
import { url } from "@/lib/utils";

export const DashboardSummary: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: tasks = [], isLoading: l1 } = useTasks({ includePlanner: true });
  const { data: subjects = [], isLoading: l2 } = useSubjects();
  const { data: absences = [], isLoading: l3 } = useAllAbsences();
  const { data: journals = [] } = useJournals();
  const { data: events = [] } = useIcalEvents();
  const updateTask = useUpdateTask();

  if (authLoading || l1 || l2 || l3) {
    return <div className="p-16" aria-busy="true" aria-label="Cargando resumen" />;
  }
  if (!user) return null;

  const subjectName = (id?: string | null) => subjects.find((s) => s.id === id)?.name;
  const pending = tasks.filter((t) => t.status !== "done");
  const overdue = pending.filter((t) => daysUntil(t.due_date) < 0);
  const upcoming = [...pending].sort(
    (a, b) => toLocalDay(a.due_date).getTime() - toLocalDay(b.due_date).getTime(),
  );
  const next = upcoming.find((t) => daysUntil(t.due_date) >= 0);
  const grades = tasks.map((t) => t.grade).filter((g): g is number => g != null);
  const avg = average(grades);

  const attendance = subjects
    .map((s) => {
      const value = absences
        .filter((a) => a.subject_id === s.id)
        .reduce((sum, a) => sum + (a.calculated_value || 0), 0);
      return { subject: s, info: attendanceInfo(s.total_classes, value) };
    })
    .sort((a, b) => a.info.remaining - b.info.remaining);
  const atRisk = attendance.filter((a) => a.info.status !== "ok");

  const weekEvents = events
    .filter((e) => {
      const n = daysUntil(e.start_date);
      return n >= 0 && n <= 7;
    })
    .slice(0, 3);

  const todayEntry = journals.find((j) => dayKey(j.date) === todayKey());
  const lastEntry = [...journals].sort(
    (a, b) => toLocalDay(b.date).getTime() - toLocalDay(a.date).getTime(),
  )[0];

  const toggle = (t: Task) =>
    updateTask.mutate({ id: t.id, data: { status: t.status === "done" ? "todo" : "done" } });
  const today = new Intl.DateTimeFormat("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div>
      <PageHeader
        title={`Hola, ${user.name.split(" ")[0]}`}
        subtitle={today.charAt(0).toUpperCase() + today.slice(1)}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatTile
          label="Pendientes"
          value={pending.length}
          hint={
            overdue.length
              ? `${overdue.length} vencida${overdue.length > 1 ? "s" : ""}`
              : "Nada vencido"
          }
          tone={overdue.length ? "danger" : "default"}
          href={url("/tasks")}
        />
        <StatTile
          label="Próxima entrega"
          value={next ? dueLabel(next.due_date) : "—"}
          hint={next?.title ?? "Sin entregas"}
          href={url("/tasks")}
        />
        <StatTile
          label="Asistencia"
          value={atRisk.length ? `${atRisk.length} en riesgo` : "Al día"}
          hint={
            atRisk[0]
              ? `${atRisk[0].subject.name}: ${remainingLabel(atRisk[0].info).toLowerCase()}`
              : "Ninguna UC cerca del límite"
          }
          tone={
            atRisk.some((a) => a.info.status === "danger")
              ? "danger"
              : atRisk.length
                ? "warning"
                : "success"
          }
          href={url("/subjects")}
        />
        <StatTile
          label="Promedio"
          value={avg ?? "—"}
          hint={grades.length ? `${grades.length} notas cargadas` : "Sin notas aún"}
          href={url("/analytics")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 sm:gap-6">
        <Card
          title="Próximas tareas"
          action={
            <a
              href={url("/tasks")}
              className="text-sm text-theme-text-muted no-underline hover:text-theme-text inline-flex items-center gap-1"
            >
              Ver todas <ArrowRight size={14} />
            </a>
          }
        >
          {upcoming.length === 0 ? (
            <p className="m-0 text-sm text-theme-text-muted">Sin tareas pendientes.</p>
          ) : (
            <ul className="list-none m-0 p-0">
              {upcoming.slice(0, 6).map((t) => {
                const n = daysUntil(t.due_date);
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 py-2.5 border-b border-theme-border last:border-b-0"
                  >
                    <button
                      onClick={() => toggle(t)}
                      aria-label={`Marcar "${t.title}" como hecha`}
                      className="w-5 h-5 shrink-0 rounded-full border-2 border-theme-border bg-transparent hover:border-theme-success hover:bg-theme-success-light flex items-center justify-center cursor-pointer p-0"
                    >
                      <Check size={12} className="opacity-0 hover:opacity-100 text-theme-success" />
                    </button>
                    <a
                      href={url(`/tasks/${t.slug || t.id}`)}
                      className="flex-1 min-w-0 no-underline text-theme-text"
                    >
                      <span className="block text-sm font-medium truncate">{t.title}</span>
                      {subjectName(t.subject_id) && (
                        <span className="block text-xs text-theme-text-muted truncate">
                          {subjectName(t.subject_id)}
                        </span>
                      )}
                    </a>
                    <span
                      className={`text-xs font-medium whitespace-nowrap ${n < 0 ? "text-theme-danger" : n <= 2 ? "text-theme-warning" : "text-theme-text-muted"}`}
                    >
                      {dueLabel(t.due_date)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {weekEvents.length > 0 && (
            <div className="mt-4 pt-4 border-t border-theme-border">
              <p className="m-0 mb-2 text-xs font-medium uppercase tracking-wide text-theme-text-muted">
                Calendario (próximos 7 días)
              </p>
              {weekEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-2 py-1 text-sm">
                  <CalendarDays size={14} className="text-theme-info shrink-0" />
                  <span className="truncate flex-1">{e.title}</span>
                  <span className="text-xs text-theme-text-muted">{dueLabel(e.start_date)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-4 sm:gap-6">
          <Card
            title="Asistencia por UC"
            action={
              <a
                href={url("/subjects")}
                className="text-sm text-theme-text-muted no-underline hover:text-theme-text inline-flex items-center gap-1"
              >
                UC <ArrowRight size={14} />
              </a>
            }
          >
            {attendance.length === 0 ? (
              <p className="m-0 text-sm text-theme-text-muted">
                Agregá tus UC para seguir las faltas.
              </p>
            ) : (
              <ul className="list-none m-0 p-0 flex flex-col gap-3">
                {attendance.slice(0, 5).map(({ subject, info }) => (
                  <li key={subject.id}>
                    <div className="flex justify-between gap-2 text-sm mb-1">
                      <a
                        href={url(`/subjects/${subject.slug || subject.id}`)}
                        className="font-medium no-underline text-theme-text truncate"
                      >
                        {subject.name}
                      </a>
                      <span
                        className={`text-xs whitespace-nowrap ${info.status === "danger" ? "text-theme-danger" : info.status === "warning" ? "text-theme-warning" : "text-theme-text-muted"}`}
                      >
                        {remainingLabel(info)}
                      </span>
                    </div>
                    <ProgressBar
                      value={info.maxAbsences ? (info.absences / info.maxAbsences) * 100 : 0}
                      tone={
                        info.status === "danger"
                          ? "danger"
                          : info.status === "warning"
                            ? "warning"
                            : "ok"
                      }
                      label={`Faltas usadas en ${subject.name}`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Diario de práctica">
            {lastEntry ? (
              <p className="m-0 mb-4 text-sm text-theme-text-muted line-clamp-3">
                <span className="font-medium text-theme-text">
                  Última: {formatDayLong(lastEntry.date)}.
                </span>{" "}
                {lastEntry.content}
              </p>
            ) : (
              <p className="m-0 mb-4 text-sm text-theme-text-muted">Todavía no hay entradas.</p>
            )}
            <a
              href={url("/journal")}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-theme-primary text-theme-bg text-sm font-medium no-underline hover:opacity-90"
            >
              <PenLine size={16} /> {todayEntry ? "Editar la de hoy" : "Escribir la de hoy"}
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
};
