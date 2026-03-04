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
  const [selectedEntry, setSelectedEntry] = useState<any>(null); // Entrada seleccionada para ver en Modal

  const { data: journalOnDate, isLoading: loadingJournal } = useJournalByDate(currentDate);
  const { data: unSortedHistory = [], isLoading: loadingHistory } = useJournals();
  const upsertJournal = useUpsertJournal();

  const { toast, showToast, hideToast } = useToast();

  // Solo mostrar spinner completo en la carga inicial, no al cambiar de fecha
  const isInitialLoad = loadingHistory && !unSortedHistory.length;

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

  if (authLoading || isInitialLoad) {
    return (
      <div className="oat-spinner-wrapper" aria-busy="true" aria-label="Cargando prácticas"></div>
    );
  }

  // Establecer el "hoy" real para ocultarlo del historial de "pasadas" sin que varíe al cambiar currentDate
  const actualToday = new Date().toISOString().split("T")[0];

  // Ordenar historial cronológicamente y excluir SOLO la entrada de "hoy" de forma estática
  const sortedHistory = [...unSortedHistory]
    .filter((entry) => {
      const entryDate =
        entry.date instanceof Date
          ? entry.date.toISOString().split("T")[0]
          : new Date(entry.date).toISOString().split("T")[0];
      return entryDate !== actualToday;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {loadingJournal && (
              <span style={{ fontSize: "0.75rem", color: "var(--oat-text-muted)", opacity: 0.7 }}>
                Cargando...
              </span>
            )}
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="oat-input journal-date-input"
              style={{ width: "auto", minWidth: "150px" }}
              aria-label="Seleccionar fecha para la práctica"
            />
          </div>
        </header>

        <style>{`
          .journal-date-input {
            position: relative;
            cursor: pointer;
          }
          .journal-date-input::-webkit-calendar-picker-indicator {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
          }
        `}</style>

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
                <div
                  key={entry.id}
                  className="oat-card journal-history-item"
                  style={{ cursor: "pointer", transition: "transform 0.2s" }}
                  onClick={() => setSelectedEntry(entry)}
                >
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
                      display: "-webkit-box",
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
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

      {/* Modal / Popup de Historial */}
      {selectedEntry && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="oat-card"
            style={{
              width: "100%",
              maxWidth: "800px",
              maxHeight: "85vh",
              overflowY: "auto",
              position: "relative",
              backgroundColor: "var(--oat-bg)",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              padding: "2rem",
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px solid var(--oat-border)",
                paddingBottom: "1rem",
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 0.5rem 0" }}>Práctica: {selectedEntry.subject_id}</h3>
                <span style={{ fontSize: "0.875rem", color: "var(--oat-text-muted)" }}>
                  {formatDateDisplay(selectedEntry.date)}
                </span>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "var(--oat-text-muted)",
                  lineHeight: 1,
                  padding: "0.25rem",
                }}
                aria-label="Cerrar modal"
              >
                &times;
              </button>
            </div>

            <div
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: "1.8",
                color: "var(--oat-text)",
                fontSize: "1rem",
              }}
            >
              {selectedEntry.content || <em>Sin contenido</em>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
