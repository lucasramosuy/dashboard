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

interface Props {
  id: string;
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-theme-border bg-theme-card-bg text-theme-text text-sm transition-all duration-200 focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/15 hover:border-theme-accent";

const btnOutline =
  "px-3 py-1.5 rounded-lg text-sm font-semibold border border-theme-border bg-transparent text-theme-text hover:bg-theme-bg hover:border-theme-accent cursor-pointer transition-all duration-150";

const btnPrimary =
  "px-5 py-2.5 rounded-lg font-semibold border border-transparent bg-theme-primary text-theme-bg hover:bg-theme-accent cursor-pointer transition-all duration-150 whitespace-nowrap disabled:opacity-45 disabled:cursor-not-allowed";

export const SubjectDetail: React.FC<Props> = ({ id }) => {
  const { loading: authLoading } = useAuth();
  const { data: subject, isLoading: loadingSubject, error: subjectError } = useSubject(id);
  const { data: tasks = [], isLoading: loadingTasks } = useTasks({ subjectId: id });
  const { data: absences = [], isLoading: loadingAbsences } = useAbsencesBySubject(id);
  const createAbsence = useCreateAbsence();
  const deleteAbsence = useDeleteAbsence();

  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().split("T")[0]);
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
          setAbsenceDate(new Date().toISOString().split("T")[0]);
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
  const attendancePercentage =
    subject.total_classes > 0
      ? Math.max(
          0,
          Math.round(((subject.total_classes - totalAbsenceValue) / subject.total_classes) * 100),
        )
      : 100;
  const riskVariant =
    attendancePercentage < 75 ? "danger" : attendancePercentage < 85 ? "warning" : "success";

  return (
    <>
      <div className="max-w-900px mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-theme-border pb-4 flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <BackButton fallback="/subjects" />
            <h1 className="m-0 text-theme-text">{subject.name}</h1>
          </div>
          <StatusBadge variant={riskVariant}>
            {riskVariant === "success"
              ? "Bajo riesgo"
              : riskVariant === "warning"
                ? "Riesgo medio"
                : "Alto riesgo"}
          </StatusBadge>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          {/* Métricas */}
          <section className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl m-0 text-theme-text">Asistencia</h2>
              <button
                onClick={() => setShowAbsenceForm(!showAbsenceForm)}
                className={`${btnOutline} text-xs`}
                aria-expanded={showAbsenceForm}
                aria-controls="absence-form"
              >
                {showAbsenceForm ? "Cancelar" : "+ Registrar inasistencia"}
              </button>
            </div>

            {showAbsenceForm && (
              <div
                id="absence-form"
                className="bg-theme-bg border border-theme-border rounded-lg p-4 mb-4"
              >
                <div className="flex gap-3 flex-wrap items-end">
                  <div className="flex-1 min-w-140px">
                    <label
                      htmlFor="absenceDate"
                      className="block text-xs mb-1 text-theme-text-muted"
                    >
                      Fecha
                    </label>
                    <input
                      ref={dateInputRef}
                      id="absenceDate"
                      type="date"
                      className={inputCls}
                      value={absenceDate}
                      onChange={(e) => setAbsenceDate(e.target.value)}
                      onClick={() => {
                        if (dateInputRef.current && "showPicker" in HTMLInputElement.prototype) {
                          try {
                            dateInputRef.current.showPicker();
                          } catch {
                            /* ignore */
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-140px">
                    <label
                      htmlFor="absenceType"
                      className="block text-xs mb-1 text-theme-text-muted"
                    >
                      Tipo
                    </label>
                    <select
                      id="absenceType"
                      className={inputCls}
                      value={absenceValue}
                      onChange={(e) => setAbsenceValue(Number(e.target.value))}
                    >
                      <option value={1}>Falta completa (1)</option>
                      <option value={0.5}>Media falta (0.5)</option>
                    </select>
                  </div>
                  <button
                    onClick={handleCreateAbsence}
                    className={btnPrimary}
                    disabled={createAbsence.isPending}
                    aria-label="Guardar inasistencia"
                  >
                    {createAbsence.isPending ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            )}

            <div className="text-center py-4">
              <span
                className="text-5xl font-bold text-theme-primary"
                aria-label={`Porcentaje de asistencia: ${attendancePercentage}%`}
              >
                {attendancePercentage}%
              </span>
              <p className="text-theme-text-muted mt-1 mb-0">Asistencia actual</p>
            </div>

            <div className="border-t border-theme-border pt-4">
              <p className="my-2">
                Clases totales: <strong>{subject.total_classes}</strong>
              </p>
              <p className="my-2">
                Inasistencias: <strong className="text-theme-danger">{totalAbsenceValue}</strong>
              </p>
            </div>

            {absences.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-theme-text-muted mb-2">Historial de inasistencias</p>
                <ul className="list-none p-0 m-0" aria-label="Historial de inasistencias">
                  {absences.map((a) => (
                    <li
                      key={a.id}
                      className="flex justify-between items-center py-1.5 border-b border-theme-border last:border-b-0"
                    >
                      <span className="text-sm">
                        {new Date(a.date).toLocaleDateString("es-UY")} —{" "}
                        <strong>
                          {a.calculated_value === 0.5 ? "Media falta" : "Falta completa"}
                        </strong>
                      </span>
                      <button
                        onClick={() => handleDeleteAbsence(a.id)}
                        className="bg-transparent border-none cursor-pointer text-theme-danger text-xs hover:underline"
                        aria-label={`Eliminar inasistencia del ${new Date(a.date).toLocaleDateString("es-UY")}`}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Tareas */}
          <section className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl mb-4 text-theme-text">Historial de Tareas</h2>
            {tasks.length === 0 ? (
              <p className="text-theme-text-muted">No hay tareas asociadas.</p>
            ) : (
              <ul className="list-none p-0" aria-label="Historial de Tareas">
                {tasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex justify-between py-3 border-b border-theme-border last:border-b-0"
                  >
                    <a
                      href={`/tasks/${t.slug || t.id}`}
                      className="no-underline text-theme-text hover:text-theme-primary transition-colors"
                    >
                      {t.title}
                    </a>
                    <StatusBadge variant={t.status === "done" ? "success" : "warning"}>
                      {t.status === "done" ? "Ok" : "Pendiente"}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </>
  );
};
