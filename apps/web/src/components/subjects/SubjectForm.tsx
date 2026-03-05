import React, { useState } from "react";
import type { Subject } from "@dashboard/shared-types";

interface Props {
  initialData?: Subject;
  onSubmit: (data: Partial<Subject>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const CFE_RULES: Record<string, number> = {
  semestral: 15,
  anual: 30,
};

export const SubjectForm: React.FC<Props> = ({ initialData, onSubmit, onCancel, loading }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [track, setTrack] = useState<string>(initialData?.track || "");
  const [totalClassesStr, setTotalClassesStr] = useState(String(initialData?.total_classes ?? 1));

  const handleTrackChange = (value: string) => {
    setTrack(value);
    if (value && CFE_RULES[value]) {
      setTotalClassesStr(String(CFE_RULES[value]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseInt(totalClassesStr, 10);
    if (!total || total < 1) return;
    await onSubmit({
      name,
      total_classes: total,
      track: (track || undefined) as Subject["track"],
      duration_weeks: track ? CFE_RULES[track] : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="name" className="block mb-1 text-sm font-medium text-theme-text-muted">
          Nombre
        </label>
        <input
          id="name"
          type="text"
          className="w-full px-3 py-2.5 rounded-lg border border-theme-border bg-theme-card-bg text-theme-text text-sm transition-all duration-200 focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/15 hover:border-theme-accent disabled:opacity-60 disabled:cursor-not-allowed"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="track" className="block mb-1 text-sm font-medium text-theme-text-muted">
          Trayecto
        </label>
        <select
          id="track"
          className="w-full px-3 py-2.5 rounded-lg border border-theme-border bg-theme-card-bg text-theme-text text-sm transition-all duration-200 focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/15 hover:border-theme-accent [&>option]:bg-theme-card-bg [&>option]:text-theme-text"
          value={track}
          onChange={(e) => handleTrackChange(e.target.value)}
          required
        >
          <option value="" disabled>
            Seleccioná un trayecto
          </option>
          <option value="semestral">Semestral (15 semanas)</option>
          <option value="anual">Anual (30 semanas)</option>
        </select>
        {track && (
          <small className="text-theme-text-muted mt-1 block text-xs">
            Sugerencia CFE: {CFE_RULES[track]} clases
          </small>
        )}
      </div>
      <div className="mb-4">
        <label htmlFor="total" className="block mb-1 text-sm font-medium text-theme-text-muted">
          Clases Totales
        </label>
        <input
          id="total"
          type="number"
          className="w-full px-3 py-2.5 rounded-lg border border-theme-border bg-theme-card-bg text-theme-text text-sm transition-all duration-200 focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/15 hover:border-theme-accent"
          value={totalClassesStr}
          onChange={(e) => setTotalClassesStr(e.target.value)}
          onBlur={() => {
            const n = parseInt(totalClassesStr, 10);
            if (!n || n < 1) setTotalClassesStr("1");
          }}
          min="1"
          required
        />
      </div>
      <div className="flex gap-2 justify-end mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg font-semibold border border-theme-border bg-transparent text-theme-text hover:bg-theme-bg hover:border-theme-accent cursor-pointer transition-all duration-150 disabled:opacity-45 disabled:cursor-not-allowed"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-lg font-semibold border border-transparent bg-theme-primary text-theme-bg hover:bg-theme-accent hover:-translate-y-px hover:shadow-md active:translate-y-0 active:shadow-none cursor-pointer transition-all duration-150 disabled:opacity-45 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Guardando..." : initialData ? "Actualizar" : "Crear"}
        </button>
      </div>
    </form>
  );
};
