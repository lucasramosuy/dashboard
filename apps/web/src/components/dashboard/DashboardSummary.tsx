import { DashboardSkeleton } from "../ui/Skeleton";
import { QueryState } from "../ui/QueryState";
import { readState, firstRunStep } from "../../lib/query-state";
import React from "react";
import { Check, ArrowRight } from "lucide-react";
import { subjectHealth, nextAction, type Task } from "@dashboard/shared-types";
import { useAuth } from "../../contexts/AuthContext";
import {
  useTasks,
  useSubjects,
  useAllAbsences,
  useIcalEvents,
  useUpdateTask,
} from "../../hooks/useDashboardQueries";
import { PageHeader, Card, StatTile, ProgressBar, Chip, TextLink } from "../ui/PageHeader";
import {
  attendanceInfo,
  average,
  daysUntil,
  dueLabel,
  toLocalDay,
  todayKey,
} from "../../lib/format";
import { url } from "@/lib/utils";

export const DashboardSummary: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const tasksQuery = useTasks({ includePlanner: true });
  const { data: tasks = [], isLoading: l1 } = tasksQuery;
  const subjectsQuery = useSubjects();
  const { data: subjects = [], isLoading: l2 } = subjectsQuery;
  const absencesQuery = useAllAbsences();
  const { data: absences = [], isLoading: l3 } = absencesQuery;
  const eventsQuery = useIcalEvents();
  const { data: events = [] } = eventsQuery;
  const updateTask = useUpdateTask();

  const reads = [tasksQuery, subjectsQuery, absencesQuery, eventsQuery];
  if (readState(reads) === "error")
    return (
      <QueryState queries={reads} loading={<DashboardSkeleton />}>
        {null}
      </QueryState>
    );
  if (authLoading || l1 || l2 || l3) {
    return <DashboardSkeleton />;
  }
  if (!user) return null;

  const onboarding = firstRunStep(
    subjects.length,
    tasks.filter((t) => !t.is_planner).length,
    Boolean(user.ical_url),
  );
  const subjectName = (id?: string | null) => subjects.find((s) => s.id === id)?.name;
  const pending = tasks.filter((t) => t.status !== "done");
  const overdue = pending.filter((t) => daysUntil(t.due_date) < 0);
  const upcoming = [...pending].sort(
    (a, b) => toLocalDay(a.due_date).getTime() - toLocalDay(b.due_date).getTime(),
  );
  const next = upcoming.find((t) => daysUntil(t.due_date) >= 0);
  const action = nextAction(tasks, subjects, todayKey());
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
  const healths = subjects
    .map((s) => ({
      subject: s,
      health: subjectHealth({
        subject: s,
        absences: absences.filter((a) => a.subject_id === s.id),
        tasks: tasks.filter((t) => t.subject_id === s.id),
        today: todayKey(),
      }),
    }))
    .sort(
      (a, b) =>
        ["risk", "attention", "ok"].indexOf(a.health.level) -
        ["risk", "attention", "ok"].indexOf(b.health.level),
    );
  const riskCount = healths.filter((h) => h.health.level === "risk").length;
  const attentionCount = healths.filter((h) => h.health.level === "attention").length;
  const worst = healths[0]?.health.reasons[0]
    ? `${healths[0].subject.name}: ${healths[0].health.reasons[0].text}`
    : null;

  const weekEvents = events
    .filter((e) => {
      const n = daysUntil(e.start_date);
      return n >= 0 && n <= 7;
    })
    .slice(0, 4);

  const toggle = (t: Task) =>
    updateTask.mutate({ id: t.id, data: { status: t.status === "done" ? "todo" : "done" } });
  const today = new Intl.DateTimeFormat("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const dueChip = (n: number) =>
    n < 0 ? (
      <Chip tone="danger">Vencida</Chip>
    ) : n <= 1 ? (
      <Chip tone="accent">{n === 0 ? "Hoy" : "Mañana"}</Chip>
    ) : null;

  return (
    <QueryState queries={reads} loading={<DashboardSkeleton />}>
      <div>
        <PageHeader
          eyebrow={today.replace(", ", " · ").toUpperCase()}
          title={
            <>
              Hola, <em>{user.name.split(" ")[0]}</em>.
            </>
          }
        />

        {onboarding !== "ready" && (
          <Card title="Primeros pasos" className="mb-6">
            <ol className="list-none m-0 p-0 grid sm:grid-cols-3 gap-4">
              {[
                {
                  step: "subjects",
                  title: "1. Creá una UC",
                  description: "Organizá tus tareas y asistencia.",
                  href: "/subjects",
                },
                {
                  step: "tasks",
                  title: "2. Agregá una tarea",
                  description: "Anotá tu próxima entrega.",
                  href: "/tasks",
                },
                {
                  step: "calendar",
                  title: "3. Conectá el calendario",
                  description: "Opcional: importá tus eventos.",
                  href: "/schoology",
                },
              ].map((s) => (
                <li
                  key={s.step}
                  className={`rounded-lg border p-4 ${onboarding === s.step ? "border-theme-accent bg-theme-soft" : "border-theme-border"}`}
                >
                  <p className="m-0 mb-2 font-semibold text-sm">{s.title}</p>
                  <p className="m-0 mb-3 text-sm text-theme-text-muted">{s.description}</p>
                  <TextLink href={url(s.href)}>
                    {onboarding === s.step ? "Empezar" : "Ver"} <ArrowRight size={14} />
                  </TextLink>
                </li>
              ))}
            </ol>
          </Card>
        )}
        <Card title="Próxima acción" className="mb-6">
          {action ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="m-0 mb-2 text-sm text-theme-text-muted">
                  {action.reason}
                  {action.subjectName ? ` · ${action.subjectName}` : ""}
                  {action.task.status === "in-progress" ? " · En curso" : ""}
                </p>
                <p className="m-0 font-semibold break-words">{action.task.title}</p>
              </div>
              <TextLink href={url(`/tasks/${action.task.slug || action.task.id}`)}>
                {action.task.status === "in-progress" ? "Continuar tarea" : "Abrir tarea"}
                <ArrowRight size={14} />
              </TextLink>
            </div>
          ) : (
            <p className="m-0 text-sm text-theme-text-muted">
              Sin tareas pendientes. No hay una acción por entrega para sugerir.
            </p>
          )}
        </Card>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatTile
            label="01 / Pendientes"
            value={pending.length}
            hint={
              overdue.length
                ? `${overdue.length} vencida${overdue.length > 1 ? "s" : ""}`
                : "Nada vencido"
            }
            tone={overdue.length ? "danger" : "default"}
            chip
            href={url("/tasks")}
          />
          <StatTile
            label="02 / Próxima entrega"
            value={next ? dueLabel(next.due_date) : "—"}
            hint={next?.title ?? "Sin entregas"}
            href={url("/tasks")}
          />
          <StatTile
            label="03 / Salud de las UC"
            value={
              !subjects.length
                ? "Sin UC"
                : riskCount
                  ? `${riskCount} en riesgo`
                  : attentionCount
                    ? `${attentionCount} con atención`
                    : "Al día"
            }
            hint={
              !subjects.length
                ? "Creá una UC para seguir su salud"
                : (worst ?? "Ninguna UC necesita atención")
            }
            tone={riskCount ? "danger" : attentionCount ? "warning" : "default"}
            chip
            href={url("/subjects")}
          />
          <StatTile
            label="04 / Promedio"
            value={avg ?? "—"}
            hint={grades.length ? `${grades.length} notas cargadas` : "Sin notas aún"}
            href={url("/analytics")}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-4 sm:gap-6 items-start">
          <Card
            title="Próximas tareas"
            action={
              <TextLink href={url("/tasks")}>
                Ver todas <ArrowRight size={14} />
              </TextLink>
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
                      className="flex items-center gap-4 py-4 border-t border-theme-border first:border-t-0 first:pt-0 last:pb-0"
                    >
                      <button
                        onClick={() => toggle(t)}
                        aria-label={`Marcar "${t.title}" como hecha`}
                        className="w-5 h-5 shrink-0 rounded-md border border-theme-text-muted bg-transparent [@media(hover:hover)]:hover:border-theme-accent flex items-center justify-center cursor-pointer p-0 group"
                      >
                        <Check
                          size={12}
                          strokeWidth={3}
                          className="opacity-0 [@media(hover:hover)]:group-hover:opacity-100 text-theme-accent"
                        />
                      </button>
                      <a
                        href={url(`/tasks/${t.slug || t.id}`)}
                        className="flex-1 min-w-0 no-underline text-theme-text"
                      >
                        <span className="block text-sm font-medium truncate">{t.title}</span>
                        {subjectName(t.subject_id) && (
                          <span className="block text-xs text-theme-text-muted truncate mt-0.5">
                            {subjectName(t.subject_id)}
                          </span>
                        )}
                      </a>
                      <span className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-xs text-theme-text-muted whitespace-nowrap">
                          {dueLabel(t.due_date)}
                        </span>
                        {dueChip(n)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <div className="flex flex-col gap-4 sm:gap-6">
            <Card
              title="Asistencia"
              action={
                <TextLink href={url("/subjects")}>
                  UC <ArrowRight size={14} />
                </TextLink>
              }
            >
              {attendance.length === 0 ? (
                <p className="m-0 text-sm text-theme-text-muted">
                  Agregá tus UC para seguir las faltas.
                </p>
              ) : (
                <ul className="list-none m-0 p-0 flex flex-col gap-5">
                  {attendance.slice(0, 5).map(({ subject, info }) => (
                    <li key={subject.id}>
                      <div className="flex justify-between gap-3 text-sm mb-2.5">
                        <a
                          href={url(`/subjects/${subject.slug || subject.id}`)}
                          className="font-medium no-underline text-theme-text truncate"
                        >
                          {subject.name}
                        </a>
                        <span className="text-xs whitespace-nowrap text-theme-text-muted font-mono">
                          {info.percentage}%
                        </span>
                      </div>
                      <ProgressBar
                        value={info.percentage}
                        tone={
                          info.status === "danger"
                            ? "danger"
                            : info.status === "warning"
                              ? "warning"
                              : "ok"
                        }
                        label={`Asistencia en ${subject.name}`}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card
              title="Esta semana"
              eyebrow="Agenda"
              action={
                <TextLink href={url("/planner")}>
                  Planner <ArrowRight size={14} />
                </TextLink>
              }
            >
              {weekEvents.length === 0 ? (
                <p className="m-0 text-sm text-theme-text-muted">
                  Sin eventos en los próximos 7 días.
                </p>
              ) : (
                <ul className="list-none m-0 p-0 flex flex-col gap-3">
                  {weekEvents.map((e) => (
                    <li key={e.id} className="rounded-lg bg-theme-soft px-4 py-3">
                      <span className="block text-sm font-medium truncate">{e.title}</span>
                      <span className="block text-xs text-theme-text-muted mt-0.5">
                        {dueLabel(e.start_date)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
    </QueryState>
  );
};
