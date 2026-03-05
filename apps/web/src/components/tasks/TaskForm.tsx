import React, { useState } from "react";
import type { Task, Subject } from "@dashboard/shared-types";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

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

const selectCls =
  "w-full px-3 py-2.5 rounded-button border border-zinc-200 bg-transparent text-content text-sm transition-colors focus:border-zinc-900 focus:outline-none focus:ring-0 dark:border-zinc-800 dark:text-content-dark dark:focus:border-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed";

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
  const dueDateInputRef = React.useRef<HTMLInputElement>(null);
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
        <Input
          id="title"
          label="Título de la Tarea"
          type="text"
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
          className={selectCls}
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
        <Input
          ref={dueDateInputRef}
          id="due"
          label="Fecha de Entrega"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          onClick={() => {
            if (dueDateInputRef.current && "showPicker" in HTMLInputElement.prototype) {
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
        <label
          htmlFor="status"
          className="block mb-1 text-xs text-content-secondary dark:text-content-dark-secondary px-1"
        >
          Estado
        </label>
        <select
          id="status"
          className={selectCls}
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
            className="block mb-1 text-xs text-content-secondary dark:text-content-dark-secondary px-1"
          >
            Tipo de Evaluación
          </label>
          <select
            id="taskType"
            className={selectCls}
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
          <Input
            id="grade"
            label="Calificación (0–12)"
            type="number"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            min="0"
            max="12"
            step="1"
          />
        </div>
      </div>
      <div className="mb-4">
        <label
          htmlFor="comments"
          className="block mb-1 text-xs text-content-secondary dark:text-content-dark-secondary px-1"
        >
          Comentarios
        </label>
        <textarea
          id="comments"
          className={`${selectCls} min-h-60px`}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Notas adicionales sobre la tarea..."
        />
      </div>
      <div className="mb-4">
        <label
          htmlFor="desc"
          className="block mb-1 text-xs text-content-secondary dark:text-content-dark-secondary px-1"
        >
          Descripción
        </label>
        <textarea
          id="desc"
          className={`${selectCls} min-h-80px`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex gap-2 justify-end mt-6">
        <Button variant="ghost" type="button" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" isLoading={loading}>
          {initialData ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
};
