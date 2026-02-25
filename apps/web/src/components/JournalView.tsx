import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Toast } from "./Toast";
import { useToast } from "../hooks/useToast";
import type { PracticeJournal } from "@dashboard/shared-types";

const PRACTICE_SUBJECTS = ["Derecho", "Sociología"];

function formatDateDisplay(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("es-UY", { year: "numeric", month: "long", day: "numeric" });
}

export const JournalView: React.FC = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split("T")[0]);
  const [journal, setJournal] = useState<Partial<PracticeJournal>>({ content: "", subject_id: "" });
  const [history, setHistory] = useState<PracticeJournal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [journalData, historyData] = await Promise.all([
        api.getJournalByDate(token, currentDate),
        api.getJournals(token),
      ]);
      if (journalData) {
        setJournal(journalData);
      } else {
        setJournal({ content: "", subject_id: "", date: new Date(currentDate) });
      }
      setHistory(historyData ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) window.location.href = "/login";
  }, [user, authLoading]);

  useEffect(() => {
    if (token) fetchData();
  }, [token, currentDate]);

  const handleSave = async () => {
    if (!token) return;
    if (!journal.subject_id) {
      showToast("Seleccioná una materia", "error");
      return;
    }
    setSaving(true);
    try {
      const saved = await api.upsertJournal(token, {
        ...journal,
        date: new Date(currentDate),
      });
      setJournal({ content: "", subject_id: "", date: new Date(currentDate) });
      // Refrescar historial
      const historyData = await api.getJournals(token);
      setHistory(historyData ?? []);
      showToast("Práctica guardada correctamente");
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="oat-spinner-wrapper">
        <div className="oat-spinner" />
        <span>Cargando...</span>
      </div>
    );
  }

  const sortedHistory = [...history].sort(
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
              Materia Asociada
            </label>
            <select
              id="subject"
              className="oat-input"
              value={journal.subject_id}
              onChange={(e) => setJournal({ ...journal, subject_id: e.target.value })}
              required
            >
              <option value="" disabled>
                Seleccioná una materia
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
              value={journal.content}
              onChange={(e) => setJournal({ ...journal, content: e.target.value })}
              style={{ minHeight: "260px", fontFamily: "inherit", lineHeight: "1.6" }}
              placeholder="Hoy en la práctica aprendí que..."
            />
          </div>

          <footer style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={handleSave} className="oat-btn oat-btn-primary" disabled={saving}>
              {saving ? "Guardando..." : "Guardar Reflexión"}
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
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
