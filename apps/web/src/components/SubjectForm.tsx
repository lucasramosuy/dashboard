import React, { useState } from "react";
import type { Subject } from "@dashboard/shared-types";

interface Props {
  initialData?: Subject;
  onSubmit: (data: Partial<Subject>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const SubjectForm: React.FC<Props> = ({ initialData, onSubmit, onCancel, loading }) => {
  const [name, setName] = useState(initialData?.name || "");
  // ← string para poder borrar y reescribir libremente
  const [totalClassesStr, setTotalClassesStr] = useState(String(initialData?.total_classes ?? 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseInt(totalClassesStr, 10);
    if (!total || total < 1) return;
    await onSubmit({ name, total_classes: total });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="name">Nombre</label>
        <input
          id="name"
          type="text"
          className="oat-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="total">Clases Totales</label>
        <input
          id="total"
          type="number"
          className="oat-input"
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
      <div
        style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="oat-btn oat-btn-outline"
          disabled={loading}
        >
          Cancelar
        </button>
        <button type="submit" className="oat-btn oat-btn-primary" disabled={loading}>
          {loading ? "Guardando..." : initialData ? "Actualizar" : "Crear"}
        </button>
      </div>
    </form>
  );
};
