import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { StatusBadge } from "./StatusBadge";
import { Toast } from "./Toast";
import { useToast } from "../hooks/useToast";
import {
  useSubject,
  useTasks,
  useAbsencesBySubject,
  useCreateAbsence,
  useDeleteAbsence,
} from "../hooks/useDashboardQueries";

interface Props {
  id: string;
}

export const SubjectDetail: React.FC<Props> = ({ id }) => {
  const { user, loading: authLoading } = useAuth();

  // React Query Hooks
  const { data: subject, isLoading: loadingSubject, error: subjectError } = useSubject(id);
  const { data: tasks = [], isLoading: loadingTasks } = useTasks(id);
  const { data: absences = [], isLoading: loadingAbsences } = useAbsencesBySubject(id);
  const createAbsence = useCreateAbsence();
  const deleteAbsence = useDeleteAbsence();

  const dateInputRef = React.useRef<globalThis.HTMLInputElement>(null);

  const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().split("T")[0]);
  const [absenceValue, setAbsenceValue] = useState<number>(1);
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const loading = loadingSubject || loadingTasks || loadingAbsences;

  useEffect(() => {
    if (typeof window !== "undefined" && !authLoading && !user) {
      window.location.replace("/login");
    }
  }, [user, authLoading]);

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
    return (
      <div
        className="oat-spinner-wrapper"
        aria-busy="true"
        aria-label="Cargando detalles de UC"
      ></div>
    );
  }

  if (subjectError) return <p style={{ color: "var(--oat-danger)" }}>Error al cargar la UC</p>;
  if (!subject) return <p className="oat-text-secondary">UC no encontrada.</p>;

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
      <div className="subject-detail-container">
        <header className="subject-detail-header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => (window.location.href = "/subjects")}
              className="oat-btn oat-btn-outline"
              aria-label="Volver a lista de UC"
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.9rem" }}
            >
              ← Volver
            </button>
            <h1 style={{ margin: 0 }}>{subject.name}</h1>
          </div>
          <StatusBadge variant={riskVariant}>
            {riskVariant === "success"
              ? "Bajo riesgo"
              : riskVariant === "warning"
                ? "Riesgo medio"
                : "Alto riesgo"}
          </StatusBadge>
        </header>

        <div className="subject-detail-grid">
          {/* Métricas */}
          <section className="oat-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Asistencia</h2>
              <button
                onClick={() => setShowAbsenceForm(!showAbsenceForm)}
                className="oat-btn oat-btn-outline"
                style={{ fontSize: "0.8rem" }}
                aria-expanded={showAbsenceForm}
                aria-controls="absence-form"
              >
                {showAbsenceForm ? "Cancelar" : "+ Registrar inasistencia"}
              </button>
            </div>

            {showAbsenceForm && (
              <div id="absence-form" className="absence-form">
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                    alignItems: "flex-end",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "140px" }}>
                    <label
                      htmlFor="absenceDate"
                      style={{
                        display: "block",
                        fontSize: "0.8rem",
                        marginBottom: "0.25rem",
                        color: "var(--oat-text-muted)",
                      }}
                    >
                      Fecha
                    </label>
                    <input
                      ref={dateInputRef}
                      id="absenceDate"
                      type="date"
                      className="oat-input"
                      value={absenceDate}
                      onChange={(e) => setAbsenceDate(e.target.value)}
                      onClick={() => {
                        if (
                          dateInputRef.current &&
                          "showPicker" in globalThis.HTMLInputElement.prototype
                        ) {
                          try {
                            dateInputRef.current.showPicker();
                          } catch {
                            // ignore
                          }
                        }
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: "140px" }}>
                    <label
                      htmlFor="absenceType"
                      style={{
                        display: "block",
                        fontSize: "0.8rem",
                        marginBottom: "0.25rem",
                        color: "var(--oat-text-muted)",
                      }}
                    >
                      Tipo
                    </label>
                    <select
                      id="absenceType"
                      className="oat-input"
                      value={absenceValue}
                      onChange={(e) => setAbsenceValue(Number(e.target.value))}
                    >
                      <option value={1}>Falta completa (1)</option>
                      <option value={0.5}>Media falta (0.5)</option>
                    </select>
                  </div>
                  <button
                    onClick={handleCreateAbsence}
                    className="oat-btn oat-btn-primary"
                    disabled={createAbsence.isPending}
                    style={{ whiteSpace: "nowrap" }}
                    aria-label="Guardar inasistencia"
                  >
                    {createAbsence.isPending ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            )}

            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <span
                style={{ fontSize: "3rem", fontWeight: "bold", color: "var(--oat-primary)" }}
                aria-label={`Porcentaje de asistencia: ${attendancePercentage}%`}
              >
                {attendancePercentage}%
              </span>
              <p className="oat-text-secondary" style={{ margin: "0.25rem 0 0" }}>
                Asistencia actual
              </p>
            </div>

            <div style={{ borderTop: "1px solid var(--oat-border)", paddingTop: "1rem" }}>
              <p style={{ margin: "0.5rem 0" }}>
                Clases totales: <strong>{subject.total_classes}</strong>
              </p>
              <p style={{ margin: "0.5rem 0" }}>
                Inasistencias:{" "}
                <strong style={{ color: "var(--oat-danger)" }}>{totalAbsenceValue}</strong>
              </p>
            </div>

            {absences.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--oat-text-muted)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Historial de inasistencias
                </p>
                <ul
                  style={{ listStyle: "none", padding: 0, margin: 0 }}
                  aria-label="Historial de inasistencias"
                >
                  {absences.map((a) => (
                    <li key={a.id} className="absence-item">
                      <span style={{ fontSize: "0.875rem" }}>
                        {new Date(a.date).toLocaleDateString("es-UY")} —{" "}
                        <strong>
                          {a.calculated_value === 0.5 ? "Media falta" : "Falta completa"}
                        </strong>
                      </span>
                      <button
                        onClick={() => handleDeleteAbsence(a.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--oat-danger)",
                          fontSize: "0.75rem",
                        }}
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
          <section className="oat-card">
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Historial de Tareas</h2>
            {tasks.length === 0 ? (
              <p className="oat-text-secondary">No hay tareas asociadas.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }} aria-label="Historial de Tareas">
                {tasks.map((t) => (
                  <li
                    key={t.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.75rem 0",
                      borderBottom: "1px solid var(--oat-border)",
                    }}
                  >
                    <a
                      href={`/tasks/${t.slug || t.id}`}
                      style={{ textDecoration: "none", color: "inherit" }}
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
