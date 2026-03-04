import React, { useState } from "react";
import type { Task, Subject } from "@dashboard/shared-types";

interface Props {
  initialData?: Task;
  subjects: Subject[];
  onSubmit: (data: Partial<Task>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

// ✅ Helper: convierte Date o string a YYYY-MM-DD para input[type=date]
function toDateInputValue(date?: Date | string): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
}

export const TaskForm: React.FC<Props> = ({
  initialData,
  subjects,
  onSubmit,
  onCancel,
  loading,
}) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [subjectId, setSubjectId] = useState(initialData?.subject_id || "");
  const [dueDate, setDueDate] = useState(toDateInputValue(initialData?.due_date)); // ✅ siempre string
  const dueDateInputRef = React.useRef<globalThis.HTMLInputElement>(null);
  const [description, setDescription] = useState(initialData?.description || "");
  const [status, setStatus] = useState<Task["status"]>(initialData?.status || "todo");
  const [taskType, setTaskType] = useState<string>(initialData?.type || "");
  const [grade, setGrade] = useState<string>(
    initialData?.grade != null ? String(initialData.grade) : "",
  );
  const [comments, setComments] = useState(initialData?.comments || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      title,
      subject_id: subjectId,
      due_date: new Date(dueDate),
      description,
      status,
      type: (taskType || undefined) as Task["type"],
      grade: grade !== "" ? Number(grade) : undefined,
      comments: comments || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="title">Título de la Tarea</label>
        <input
          id="title"
          type="text"
          className="oat-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="subject">UC</label>
        <select
          id="subject"
          className="oat-input"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          required
        >
          <option value="" disabled>
            Seleccioná una UC
          </option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="due">Fecha de Entrega</label>
        <input
          ref={dueDateInputRef}
          id="due"
          type="date"
          className="oat-input"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          onClick={() => {
            if (dueDateInputRef.current && "showPicker" in globalThis.HTMLInputElement.prototype) {
              try {
                dueDateInputRef.current.showPicker();
              } catch {
                // ignore
              }
            }
          }}
          required
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="status">Estado</label>
        <select
          id="status"
          className="oat-input"
          value={status}
          onChange={(e) => setStatus(e.target.value as Task["status"])}
        >
          <option value="todo">Pendiente</option> {/* ✅ */}
          <option value="in-progress">En proceso</option> {/* ✅ */}
          <option value="done">Completada</option> {/* ✅ */}
        </select>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div>
          <label htmlFor="taskType">Tipo de Evaluación</label>
          <select
            id="taskType"
            className="oat-input"
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
          >
            <option value="">Sin especificar</option>
            <option value="parcial">Parcial</option>
            <option value="examen">Examen</option>
            <option value="trabajo">Trabajo</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div>
          <label htmlFor="grade">Calificación (0–12)</label>
          <input
            id="grade"
            type="number"
            className="oat-input"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            min="0"
            max="12"
            step="1"
            placeholder="—"
          />
        </div>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="comments">Comentarios</label>
        <textarea
          id="comments"
          className="oat-input"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          style={{ minHeight: "60px" }}
          placeholder="Notas adicionales sobre la tarea..."
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="desc">Descripción</label>
        <textarea
          id="desc"
          className="oat-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ minHeight: "80px" }}
        />
      </div>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          justifyContent: "flex-end",
          marginTop: "1.5rem",
        }}
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
