import React from "react";
import { TASK_STAGES, taskStage, type Task } from "@dashboard/shared-types";
import { cardCls, TextLink } from "../ui/PageHeader";
import { Button } from "../ui/Button";
import { dueLabel } from "../../lib/format";
import { url } from "../../lib/utils";

export const TaskPipeline: React.FC<{
  tasks: Task[];
  subjectName: (id?: string | null) => string | undefined;
  onEdit: (task: Task) => void;
}> = ({ tasks, subjectName, onEdit }) => (
  <div>
    <p className="text-sm text-theme-text-muted m-0 mb-4">
      Entregada = hecha sin nota; calificada = hecha con nota. Para cambiar estado o nota, editá la
      tarea.
    </p>
    <div
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start"
      aria-label="Pipeline de tareas"
    >
      {TASK_STAGES.map((stage) => {
        const items = tasks.filter((task) => taskStage(task) === stage.id);
        return (
          <section key={stage.id} className={`${cardCls} p-4 min-w-0`} aria-label={stage.label}>
            <h2 className="m-0 mb-4 text-base font-semibold">
              {stage.label} · {items.length}
            </h2>
            {items.length === 0 ? (
              <p className="text-sm text-theme-text-muted m-0">Sin tareas.</p>
            ) : (
              <ul className="list-none m-0 p-0 space-y-3">
                {items.map((task) => (
                  <li key={task.id} className="border border-theme-border rounded-lg p-4 min-w-0">
                    <a
                      className="block font-medium text-theme-text no-underline break-words"
                      href={url(`/tasks/${task.slug || task.id}`)}
                    >
                      {task.title}
                    </a>
                    <p className="m-0 mt-2 text-xs text-theme-text-muted break-words">
                      {subjectName(task.subject_id) ?? "Sin UC"}
                    </p>
                    <p className="m-0 mt-2 text-sm text-theme-text-muted">
                      {dueLabel(task.due_date)}
                      {task.grade != null ? ` · Nota ${task.grade}` : ""}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <TextLink href={url(`/tasks/${task.slug || task.id}`)}>Abrir</TextLink>
                      <Button
                        variant="secondary"
                        onClick={() => onEdit(task)}
                        aria-label={`Editar tarea ${task.title}`}
                      >
                        Editar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  </div>
);
