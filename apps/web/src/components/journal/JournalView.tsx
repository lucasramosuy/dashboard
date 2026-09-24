import React, { useEffect, useMemo, useState } from "react";
import type { PracticeJournal } from "@dashboard/shared-types";
import { Search, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Toast } from "../ui/Toast";
import { Button } from "../ui/Button";
import { PageHeader, Card, cardCls } from "../ui/PageHeader";
import { useToast } from "../../hooks/useToast";
import { useJournals, useUpsertJournal } from "../../hooks/useDashboardQueries";
import { dayKey, todayKey, formatDayLong, toLocalDay } from "../../lib/format";

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-theme-border bg-theme-card-bg text-theme-text text-sm transition-all duration-200 focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/15 hover:border-theme-accent";

export const JournalView: React.FC = () => {
  const { loading: authLoading } = useAuth();
  const [currentDate, setCurrentDate] = useState(todayKey());
  const [draftContent, setDraftContent] = useState("");
  const [draftSpecialty, setDraftSpecialty] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<PracticeJournal | null>(null);
  const [query, setQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");

  const { data: history = [], isLoading: loadingHistory } = useJournals();
  const upsertJournal = useUpsertJournal();
  const { toast, showToast, hideToast } = useToast();

  // La entrada del día se busca en el historial por día local (el filtro ?date= del API no matchea).
  const journalOnDate = useMemo(() => history.find((j) => dayKey(j.date) === currentDate) ?? null, [history, currentDate]);
  const specialties = useMemo(() => Array.from(new Set(history.map((j) => j.subject_id).filter(Boolean))).sort(), [history]);

  useEffect(() => {
    setDraftContent(journalOnDate?.content ?? "");
    setDraftSpecialty(journalOnDate?.subject_id ?? (specialties.length === 1 ? specialties[0] : ""));
  }, [journalOnDate, currentDate]);

  const handleSave = () => {
    if (!draftSpecialty.trim()) {
      showToast("Escribí la especialidad o UC", "error");
      return;
    }
    upsertJournal.mutate(
      { id: journalOnDate?.id, subject_id: draftSpecialty.trim(), content: draftContent, date: new Date(currentDate) },
      {
        onSuccess: () => showToast("Práctica guardada"),
        onError: (e: Error) => showToast(e.message, "error"),
      },
    );
  };

  if (authLoading || (loadingHistory && !history.length)) {
    return <div className="p-16" aria-busy="true" aria-label="Cargando prácticas" />;
  }

  const filtered = [...history]
    .filter((e) => dayKey(e.date) !== currentDate)
    .filter((e) => !specialtyFilter || e.subject_id === specialtyFilter)
    .filter((e) => !query || e.content.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => toLocalDay(b.date).getTime() - toLocalDay(a.date).getTime());

  const isToday = currentDate === todayKey();

  return (
    <>
      <div>
        <PageHeader
          title="Diario de práctica"
          subtitle={`${history.length} entrada${history.length === 1 ? "" : "s"}`}
          actions={
            <input
              id="journal-date-input"
              type="date"
              value={currentDate}
              max={todayKey()}
              onChange={(e) => setCurrentDate(e.target.value)}
              className={`${inputCls} w-auto cursor-pointer`}
              aria-label="Fecha de la práctica"
            />
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4 sm:gap-6 items-start">
          <Card title={isToday ? "Hoy" : formatDayLong(currentDate)} action={journalOnDate ? <span className="text-xs text-theme-text-muted">Guardada</span> : null}>
            <div className="mb-4">
              <label htmlFor="specialty" className="block mb-1.5 text-sm text-theme-text-muted">
                Especialidad / UC
              </label>
              <input
                id="specialty"
                list="specialty-options"
                className={inputCls}
                value={draftSpecialty}
                onChange={(e) => setDraftSpecialty(e.target.value)}
                placeholder="Ej. Derecho"
              />
              <datalist id="specialty-options">
                {specialties.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="mb-4">
              <label htmlFor="content" className="block mb-1.5 text-sm text-theme-text-muted">
                Reflexión
              </label>
              <textarea
                id="content"
                className={`${inputCls} min-h-[220px] font-[inherit] leading-relaxed`}
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder="Qué planifiqué, qué pasó en clase, qué cambiaría..."
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} isLoading={upsertJournal.isPending} aria-label="Guardar reflexión">
                {journalOnDate ? "Guardar cambios" : "Guardar"}
              </Button>
            </div>
          </Card>

          <section aria-label="Historial de prácticas">
            <div className="flex items-center justify-between mb-3">
              <h2 className="m-0 text-base font-semibold text-theme-text">Historial</h2>
            </div>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar en el diario"
                  aria-label="Buscar en el diario"
                  className="h-9 w-full pl-8 pr-3 rounded-lg border border-theme-border bg-theme-card-bg text-theme-text text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent/15"
                />
              </div>
              {specialties.length > 1 && (
                <select
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                  aria-label="Filtrar por especialidad"
                  className="h-9 px-2 rounded-lg border border-theme-border bg-theme-card-bg text-theme-text text-sm"
                >
                  <option value="">Todas</option>
                  {specialties.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>
            {filtered.length === 0 ? (
              <div className={`${cardCls} p-6 text-sm text-theme-text-muted text-center`}>
                {history.length ? "Nada coincide con la búsqueda." : "Todavía no hay entradas anteriores."}
              </div>
            ) : (
              <ul className="list-none m-0 p-0 flex flex-col gap-2">
                {filtered.map((entry) => (
                  <li key={entry.id}>
                    <button
                      onClick={() => setSelectedEntry(entry)}
                      className={`${cardCls} w-full text-left p-4 cursor-pointer hover:shadow-md transition-shadow`}
                    >
                      <div className="flex justify-between items-center gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-theme-text">{formatDayLong(entry.date)}</span>
                        <span className="text-xs text-theme-text-muted bg-theme-bg px-2 py-0.5 rounded-full">{entry.subject_id}</span>
                      </div>
                      <p className="m-0 text-sm text-theme-text-muted line-clamp-2">{entry.content || <em>Sin contenido</em>}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {selectedEntry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4" onClick={() => setSelectedEntry(null)}>
          <div
            className="bg-theme-card-bg border border-theme-border rounded-xl w-full max-w-[720px] max-h-[85vh] overflow-y-auto flex flex-col gap-4 p-6 sm:p-8 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="m-0 text-lg font-semibold">{formatDayLong(selectedEntry.date)}</h3>
                <span className="text-sm text-theme-text-muted">{selectedEntry.subject_id}</span>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-theme-text-muted hover:bg-theme-bg"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <div className="whitespace-pre-wrap leading-[1.8] text-theme-text">{selectedEntry.content || <em>Sin contenido</em>}</div>
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setCurrentDate(dayKey(selectedEntry.date));
                  setSelectedEntry(null);
                }}
              >
                Editar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
