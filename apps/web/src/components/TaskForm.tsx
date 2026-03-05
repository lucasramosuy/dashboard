import React, { useState } from "react";
import type { Task, Subject } from "@dashboard/shared-types";

interface Props {
  initialData?: Task;
  subjects: Subject[];
  onSubmit: (data: Partial<Task>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

function toDateInputValue(date?: Date | string): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-theme-border bg-theme-card-bg text-theme-text text-sm transition-all duration-200 focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/15 hover:border-theme-accent disabled:opacity-60 disabled:cursor-not-allowed";

export const TaskForm: React.FC<Props> = ({
  initialData,
  subjects,
  onSubmit,
  onCancel,
  loading,
}) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [subjectId, setSubjectId] = useState(initialData?.subject_id || "");
  const [dueDate, setDueDate] = useState(toDateInputValue(initialData?.due_date));
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
      <div className="mb-4">
        <label htmlFor="title" className="block mb-1 text-sm font-medium text-theme-text-muted">
          Título de la Tarea
        </label>
        <input
          id="title"
          type="text"
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="subject" className="block mb-1 text-sm font-medium text-theme-text-muted">
          UC
        </label>
        <select
          id="subject"
          className={inputCls}
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
      <div className="mb-4">
        <label htmlFor="due" className="block mb-1 text-sm font-medium text-theme-text-muted">
          Fecha de Entrega
        </label>
        <input
          ref={dueDateInputRef}
          id="due"
          type="date"
          className={inputCls}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          onClick={() => {
            if (dueDateInputRef.current && "showPicker" in globalThis.HTMLInputElement.prototype) {
              try {
                dueDateInputRef.current.showPicker();
              } catch {
                /* ignore */
              }
            }
          }}
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="status" className="block mb-1 text-sm font-medium text-theme-text-muted">
          Estado
        </label>
        <select
          id="status"
          className={inputCls}
          value={status}
          onChange={(e) => setStatus(e.target.value as Task["status"])}
        >
          <option value="todo">Pendiente</option>
          <option value="in-progress">En proceso</option>
          <option value="done">Completada</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label
            htmlFor="taskType"
            className="block mb-1 text-sm font-medium text-theme-text-muted"
          >
            Tipo de Evaluación
          </label>
          <select
            id="taskType"
            className={inputCls}
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
          <label htmlFor="grade" className="block mb-1 text-sm font-medium text-theme-text-muted">
            Calificación (0–12)
          </label>
          <input
            id="grade"
            type="number"
            className={inputCls}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            min="0"
            max="12"
            step="1"
            placeholder="—"
          />
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="comments" className="block mb-1 text-sm font-medium text-theme-text-muted">
          Comentarios
        </label>
        <textarea
          id="comments"
          className={`${inputCls} min-h-[60px]`}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Notas adicionales sobre la tarea..."
        />
      </div>
      <div className="mb-4">
        <label htmlFor="desc" className="block mb-1 text-sm font-medium text-theme-text-muted">
          Descripción
        </label>
        <textarea
          id="desc"
          className={`${inputCls} min-h-80px`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
