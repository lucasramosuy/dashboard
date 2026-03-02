import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Toast } from "./Toast";
import { useToast } from "../hooks/useToast";
import { useJournalByDate, useJournals, useUpsertJournal } from "../hooks/useDashboardQueries";

const PRACTICE_SUBJECTS = ["Derecho", "Sociología"];

function formatDateDisplay(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("es-UY", { year: "numeric", month: "long", day: "numeric" });
}

export const JournalView: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split("T")[0]);
  const [draftContent, setDraftContent] = useState("");
  const [draftSubjectId, setDraftSubjectId] = useState("");

  const { data: journalOnDate, isLoading: loadingJournal } = useJournalByDate(currentDate);
  const { data: unSortedHistory = [], isLoading: loadingHistory } = useJournals();
  const upsertJournal = useUpsertJournal();

  const { toast, showToast, hideToast } = useToast();

  const loading = loadingJournal || loadingHistory;

  // Sincronizar estado local con datos del Backend cuando se carga
  useEffect(() => {
    if (journalOnDate) {
      setDraftContent(journalOnDate.content);
      setDraftSubjectId(journalOnDate.subject_id);
    } else {
      setDraftContent("");
      setDraftSubjectId("");
    }
  }, [journalOnDate, currentDate]);

  useEffect(() => {
    if (typeof window !== "undefined" && !authLoading && !user) {
      window.location.replace("/login");
    }
  }, [user, authLoading]);

  const handleSave = () => {
    if (!draftSubjectId) {
      showToast("Seleccioná una UC", "error");
      return;
    }
    upsertJournal.mutate(
      {
        id: journalOnDate?.id, // Se envia ID para hacer PUT si ya existe, sin ID para POST
        subject_id: draftSubjectId,
        content: draftContent,
        date: new Date(currentDate),
      },
      {
        onSuccess: () => {
          showToast("Práctica guardada correctamente");
        },
        onError: (e: any) => showToast(e.message, "error"),
      },
    );
  };

  if (authLoading || loading) {
    return (
      <div className="oat-spinner-wrapper" aria-busy="true" aria-label="Cargando prácticas"></div>
    );
  }

  const sortedHistory = [...unSortedHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <header
          style={{
            marginBottom: "2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <h1 style={{ margin: 0 }}>Prácticas</h1>
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="oat-input"
            style={{ width: "auto" }}
            aria-label="Seleccionar fecha para la práctica"
          />
        </header>

        <section className="oat-card" style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="subject"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                color: "var(--oat-text-muted)",
              }}
            >
              UC Asociada
            </label>
            <select
              id="subject"
              className="oat-input"
              value={draftSubjectId}
              onChange={(e) => setDraftSubjectId(e.target.value)}
              required
            >
              <option value="" disabled>
                Seleccioná una UC
              </option>
              {PRACTICE_SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="content"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                color: "var(--oat-text-muted)",
              }}
            >
              Reflexión del Día
            </label>
            <textarea
              id="content"
              className="oat-input"
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              style={{ minHeight: "260px", fontFamily: "inherit", lineHeight: "1.6" }}
              placeholder="Hoy en la práctica aprendí que..."
            />
          </div>

          <footer style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleSave}
              className="oat-btn oat-btn-primary"
              disabled={upsertJournal.isPending}
              aria-label="Guardar reflexión"
            >
              {upsertJournal.isPending ? "Guardando..." : "Guardar Reflexión"}
            </button>
          </footer>
        </section>

        {/* Historial */}
        {sortedHistory.length > 0 && (
          <section>
            <h2
              style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--oat-text-muted)" }}
            >
              Historial de prácticas
            </h2>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
              aria-label="Historial de prácticas pasadas"
            >
              {sortedHistory.map((entry) => (
                <div key={entry.id} className="oat-card journal-history-item">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      {formatDateDisplay(entry.date)}
                    </span>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--oat-text-muted)",
                        background: "var(--oat-bg)",
                        padding: "0.15rem 0.6rem",
                        borderRadius: "999px",
                      }}
                    >
                      {entry.subject_id}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.875rem",
                      color: "var(--oat-text-muted)",
                      whiteSpace: "pre-wrap",
                      lineHeight: "1.6",
                    }}
                  >
                    {entry.content || <em>Sin contenido</em>}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </>
  );
};
