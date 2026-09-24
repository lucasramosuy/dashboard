import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { StatusBadge } from "../ui/StatusBadge";
import { Toast } from "../ui/Toast";
import { useToast } from "../../hooks/useToast";
import {
  useSubject,
  useTasks,
  useAbsencesBySubject,
  useCreateAbsence,
  useDeleteAbsence,
} from "../../hooks/useDashboardQueries";

import { BackButton } from "../navigation/BackButton";
import { SubjectDetailSkeleton } from "../ui/Skeleton";
import { Plus, Trash2 } from "lucide-react";
import type { Subject } from "@dashboard/shared-types";
import { PageHeader, Card, StatTile, ProgressBar } from "../ui/PageHeader";
import { IconButton } from "../ui/IconButton";
import { Button } from "../ui/Button";
import { attendanceInfo, remainingLabel, toLocalDay, formatDay, formatDayShort, daysUntil, todayKey } from "../../lib/format";

interface Props {
  id: string;
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-theme-border bg-theme-card-bg text-theme-text text-sm transition-all duration-200 focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/15 hover:border-theme-accent";



export const SubjectDetail: React.FC<Props> = ({ id }) => {
  const { loading: authLoading } = useAuth();
  const { data: subject, isLoading: loadingSubject, error: subjectError } = useSubject(id);
  const { data: tasks = [], isLoading: loadingTasks } = useTasks({ subjectId: id });
  const { data: absences = [], isLoading: loadingAbsences } = useAbsencesBySubject(id);
  const createAbsence = useCreateAbsence();
  const deleteAbsence = useDeleteAbsence();

  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const [absenceDate, setAbsenceDate] = useState(todayKey());
  const [absenceValue, setAbsenceValue] = useState<number>(1);
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const loading = loadingSubject || loadingTasks || loadingAbsences;

  const handleCreateAbsence = () => {
    const calculated_value = absenceValue === 0.5 ? 0.5 : 1.0;
    createAbsence.mutate(
      {
        subject_id: id,
        date: new Date(absenceDate),
        type: calculated_value === 1.0 ? "standard" : "justified",
        calculated_value,
      },
      {
        onSuccess: () => {
          setShowAbsenceForm(false);
          setAbsenceDate(todayKey());
          setAbsenceValue(1);
          showToast("Inasistencia registrada");
        },
        onError: (e: any) => showToast(e.message, "error"),
      },
    );
  };

  const handleDeleteAbsence = (absenceId: string) => {
    deleteAbsence.mutate(absenceId, {
      onSuccess: () => showToast("Inasistencia eliminada"),
      onError: (e: any) => showToast(e.message, "error"),
    });
  };

  if (authLoading || loading) {
    return <SubjectDetailSkeleton />;
  }

  if (subjectError) return <p className="text-theme-danger">Error al cargar la UC</p>;
  if (!subject) return <p className="text-theme-text-muted">UC no encontrada.</p>;

  const totalAbsenceValue = absences.reduce((sum, a) => sum + (a.calculated_value || 0), 0);
  const info = attendanceInfo(subject.total_classes, totalAbsenceValue);
  const riskVariant = info.status === "danger" ? "danger" : info.status === "warning" ? "warning" : "success";
  const gradeAvg = (subject as Subject & { gradeAvg?: number | null }).gradeAvg ?? null;
  const graded = tasks.filter((t) => t.grade != null);
  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const sortedAbsences = [...absences].sort((a, b) => toLocalDay(b.date).getTime() - toLocalDay(a.date).getTime());
  const sortedTasks = [...tasks].sort((a, b) => toLocalDay(a.due_date).getTime() - toLocalDay(b.due_date).getTime());

  return (
    <>
      <div>
        <PageHeader
          back={<BackButton fallback="/subjects" />}
          title={subject.name}
          badge={
            <StatusBadge variant={riskVariant}>
              {riskVariant === "success" ? "Asistencia al día" : riskVariant === "warning" ? "Cerca del límite" : "Límite superado"}
            </StatusBadge>
          }
          subtitle={`${subject.track ? (subject.track === "anual" ? "Anual" : "Semestral") : "Sin régimen"} · ${subject.total_classes} clases`}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatTile label="Asistencia" value={`${info.percentage}%`} tone={riskVariant === "success" ? "default" : riskVariant} />
          <StatTile
            label="Faltas"
            value={`${info.absences} / ${info.maxAbsences}`}
            hint={remainingLabel(info)}
            tone={info.status === "danger" ? "danger" : info.status === "warning" ? "warning" : "default"}
          />
          <StatTile label="Promedio" value={gradeAvg ?? "—"} hint={graded.length ? `${graded.length} nota${graded.length > 1 ? "s" : ""}` : "Sin notas"} />
          <StatTile label="Pendientes" value={pendingTasks.length} hint={`${tasks.length} tareas en total`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card
            title="Inasistencias"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAbsenceForm(!showAbsenceForm)}
                aria-expanded={showAbsenceForm}
                aria-controls="absence-form"
              >
                {showAbsenceForm ? "Cancelar" : <><Plus size={14} className="mr-1" /> Registrar</>}
              </Button>
            }
          >
            <div className="mb-4">
              <ProgressBar
                value={info.maxAbsences ? (info.absences / info.maxAbsences) * 100 : 0}
                tone={info.status === "danger" ? "danger" : info.status === "warning" ? "warning" : "ok"}
                label="Faltas usadas"
              />
              <p className="m-0 mt-1.5 text-xs text-theme-text-muted">
                Justificada = media falta. Límite: {info.maxAbsences} faltas (25% de {subject.total_classes}).
              </p>
            </div>
            {showAbsenceForm && (
              <div id="absence-form" className="bg-theme-bg border border-theme-border rounded-lg p-4 mb-4">
                <div className="flex gap-3 flex-wrap items-end">
                  <div className="flex-1 min-w-[140px]">
                    <label htmlFor="absenceDate" className="block text-xs mb-1 text-theme-text-muted">Fecha</label>
                    <input
                      ref={dateInputRef}
                      id="absenceDate"
                      type="date"
                      className={inputCls}
                      value={absenceDate}
                      onChange={(e) => setAbsenceDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <label htmlFor="absenceType" className="block text-xs mb-1 text-theme-text-muted">Tipo</label>
                    <select
                      id="absenceType"
                      className={`${inputCls} [&>option]:bg-theme-card-bg [&>option]:text-theme-text`}
                      value={absenceValue}
                      onChange={(e) => setAbsenceValue(Number(e.target.value))}
                    >
                      <option value={1}>Falta (1)</option>
                      <option value={0.5}>Justificada (0,5)</option>
                    </select>
                  </div>
                  <Button onClick={handleCreateAbsence} isLoading={createAbsence.isPending} aria-label="Guardar inasistencia">
                    Guardar
                  </Button>
                </div>
              </div>
            )}
            {sortedAbsences.length === 0 ? (
              <p className="m-0 text-sm text-theme-text-muted">Sin faltas registradas.</p>
            ) : (
              <ul className="list-none p-0 m-0" aria-label="Historial de inasistencias">
                {sortedAbsences.map((a) => (
                  <li key={a.id} className="flex justify-between items-center py-2 border-b border-theme-border last:border-b-0">
                    <span className="text-sm">
                      {formatDayShort(a.date)}
                      <span className="ml-2 text-xs text-theme-text-muted">{a.calculated_value === 0.5 ? "Justificada · 0,5" : "Falta · 1"}</span>
                    </span>
                    <IconButton label={`Eliminar inasistencia del ${formatDay(a.date)}`} danger onClick={() => handleDeleteAbsence(a.id)}>
                      <Trash2 size={15} />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Tareas y notas">
            {sortedTasks.length === 0 ? (
              <p className="m-0 text-sm text-theme-text-muted">No hay tareas asociadas.</p>
            ) : (
              <ul className="list-none p-0 m-0" aria-label="Tareas de la UC">
                {sortedTasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-theme-border last:border-b-0">
                    <a href={`/tasks/${t.slug || t.id}`} className="min-w-0 no-underline text-theme-text">
                      <span className={`block text-sm font-medium truncate ${t.status === "done" ? "text-theme-text-muted" : ""}`}>{t.title}</span>
                      <span className="block text-xs text-theme-text-muted">{formatDayShort(t.due_date)}{t.type ? ` · ${t.type.charAt(0).toUpperCase() + t.type.slice(1)}` : ""}</span>
                    </a>
                    {t.grade != null ? (
                      <span className="text-base font-bold text-theme-text">{t.grade}</span>
                    ) : (
                      <StatusBadge variant={t.status === "done" ? "success" : daysUntil(t.due_date) < 0 ? "danger" : "warning"}>
                        {t.status === "done" ? "Hecha" : daysUntil(t.due_date) < 0 ? "Vencida" : "Pendiente"}
                      </StatusBadge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </>
  );
};
