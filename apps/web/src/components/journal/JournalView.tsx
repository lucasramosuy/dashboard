import React, { useEffect, useState } from "react";
import type { PracticeJournal } from "@dashboard/shared-types";
import { useAuth } from "../../contexts/AuthContext";
import { Toast } from "../ui/Toast";
import { useToast } from "../../hooks/useToast";
import { useJournalByDate, useJournals, useUpsertJournal } from "../../hooks/useDashboardQueries";

// DX-2: These subjects are hardcoded for the current deployment.
// Consider fetching from the API or a config endpoint if more are added.
const PRACTICE_SUBJECTS = ["Derecho", "Sociología"];

function formatDateDisplay(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("es-UY", { year: "numeric", month: "long", day: "numeric" });
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-theme-border bg-theme-card-bg text-theme-text text-sm transition-all duration-200 focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/15 hover:border-theme-accent";

export const JournalView: React.FC = () => {
  const { loading: authLoading } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split("T")[0]);
  const [draftContent, setDraftContent] = useState("");
  const [draftSubjectId, setDraftSubjectId] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<PracticeJournal | null>(null);
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  const { data: journalOnDate, isLoading: loadingJournal } = useJournalByDate(currentDate);
  const { data: unSortedHistory = [], isLoading: loadingHistory } = useJournals();
  const upsertJournal = useUpsertJournal();
  const { toast, showToast, hideToast } = useToast();
  const isInitialLoad = loadingHistory && !unSortedHistory.length;

  useEffect(() => {
    if (journalOnDate) {
      setDraftContent(journalOnDate.content);
      setDraftSubjectId(journalOnDate.subject_id);
    } else {
      setDraftContent("");
      setDraftSubjectId("");
    }
  }, [journalOnDate, currentDate]);

  const handleSave = () => {
    if (!draftSubjectId) {
      showToast("Seleccioná una UC", "error");
      return;
    }
    upsertJournal.mutate(
      {
        id: journalOnDate?.id,
        subject_id: draftSubjectId,
        content: draftContent,
        date: new Date(currentDate),
      },
      {
        onSuccess: () => showToast("Práctica guardada correctamente"),
        onError: (e: Error) => showToast(e.message, "error"),
      },
    );
  };

  if (authLoading || isInitialLoad) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 p-16 text-theme-text-muted text-sm"
        aria-busy="true"
        aria-label="Cargando prácticas"
      ></div>
    );
  }

  const actualToday = new Date().toISOString().split("T")[0];
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
      <div className="max-w-800px mx-auto">
        <header className="mb-8 flex justify-between items-center flex-wrap gap-4">
          <h1 className="m-0 text-theme-text">Prácticas</h1>
          <div className="flex items-center gap-2">
            {loadingJournal && (
              <span className="text-xs text-theme-text-muted opacity-70">Cargando...</span>
            )}
            <input
              ref={dateInputRef}
              id="journal-date-input"
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              onClick={() => {
                if (dateInputRef.current && "showPicker" in HTMLInputElement.prototype) {
                  try {
                    dateInputRef.current.showPicker();
                  } catch {
                    /* ignore */
                  }
                }
              }}
              className={`${inputCls} w-auto min-w-150px cursor-pointer`}
              aria-label="Seleccionar fecha para la práctica"
            />
          </div>
        </header>

        <section className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm mb-8">
          <div className="mb-6">
            <label htmlFor="subject" className="block mb-2 text-sm text-theme-text-muted">
              UC Asociada
            </label>
            <select
              id="subject"
              className={`${inputCls} [&>option]:bg-theme-card-bg [&>option]:text-theme-text`}
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

          <div className="mb-6">
            <label htmlFor="content" className="block mb-2 text-sm text-theme-text-muted">
              Reflexión del Día
            </label>
            <textarea
              id="content"
              className={`${inputCls} min-h-260px font-[inherit] leading-relaxed`}
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              placeholder="Hoy en la práctica aprendí que..."
            />
          </div>

          <footer className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-lg font-semibold border border-transparent bg-theme-primary text-theme-bg hover:bg-theme-accent cursor-pointer transition-all duration-150 disabled:opacity-45 disabled:cursor-not-allowed"
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
            <h2 className="text-lg mb-4 text-theme-text-muted">Historial de prácticas</h2>
            <div className="flex flex-col gap-4" aria-label="Historial de prácticas pasadas">
              {sortedHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-theme-card-bg border border-theme-border rounded-xl p-5 shadow-sm cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="flex justify-between mb-2 flex-wrap gap-2">
                    <span className="font-semibold text-sm">{formatDateDisplay(entry.date)}</span>
                    <span className="text-xs text-theme-text-muted bg-theme-bg px-2.5 py-0.5 rounded-full">
                      {entry.subject_id}
                    </span>
                  </div>
                  <p className="m-0 text-sm text-theme-text-muted whitespace-pre-wrap leading-relaxed line-clamp-4">
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-1000 p-4"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="bg-theme-bg border border-theme-border rounded-xl w-full max-w-800px max-h-[85vh] overflow-y-auto relative flex flex-col gap-6 p-8 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-theme-border pb-4">
              <div>
                <h3 className="m-0 mb-2">Práctica: {selectedEntry.subject_id}</h3>
                <span className="text-sm text-theme-text-muted">
                  {formatDateDisplay(selectedEntry.date)}
                </span>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="bg-transparent border-none text-2xl cursor-pointer text-theme-text-muted leading-none p-1 hover:text-theme-text"
                aria-label="Cerrar modal"
              >
                &times;
              </button>
            </div>
            <div className="whitespace-pre-wrap leading-[1.8] text-theme-text text-base">
              {selectedEntry.content || <em>Sin contenido</em>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
