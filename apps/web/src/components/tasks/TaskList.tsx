import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Modal } from "../ui/Modal";
import { ConfirmModal } from "../ui/ConfirmModal";
import { EmptyState } from "../ui/EmptyState";
import { TaskForm } from "../tasks/TaskForm";
import { StatusBadge } from "../ui/StatusBadge";
import { Toast } from "../ui/Toast";
import { Button } from "../ui/Button";
import { TableSkeleton } from "../ui/Skeleton";
import { CheckSquare, Plus, Pencil, Trash2, Check as CheckIcon } from "lucide-react";
import { PageHeader, cardCls } from "../ui/PageHeader";
import { IconButton } from "../ui/IconButton";
import { formatDay, dueLabel, daysUntil, toLocalDay } from "../../lib/format";
import { useToast } from "../../hooks/useToast";
import type { Task } from "@dashboard/shared-types";
import {
  useTasks,
  useSubjects,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from "../../hooks/useDashboardQueries";

const STATUS_LABELS: Record<Task["status"], string> = {
  todo: "Pendiente",
  "in-progress": "En proceso",
  done: "Completada",
};
const STATUS_VARIANTS: Record<Task["status"], "warning" | "info" | "success"> = {
  todo: "warning",
  "in-progress": "info",
  done: "success",
};

const TYPE_LABELS: Record<NonNullable<Task["type"]>, string> = {
  parcial: "Parcial",
  examen: "Examen",
  trabajo: "Trabajo",
  otro: "Otro",
};

export const TaskList: React.FC = () => {
  const { loading: authLoading } = useAuth();
  const { data: unorderedTasks = [], isLoading: loadingTasks } = useTasks();
  const { data: subjects = [], isLoading: loadingSubjects } = useSubjects();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();
  const [filter, setFilter] = useState<"pending" | "overdue" | "done" | "all">("pending");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [query, setQuery] = useState("");

  const loading = loadingTasks || loadingSubjects;
  const tasks = [...unorderedTasks].sort(
    (a, b) => toLocalDay(a.due_date).getTime() - toLocalDay(b.due_date).getTime(),
  );

  const handleSubmit = async (data: Partial<Task>) => {
    if (editingTask) {
      updateTask.mutate(
        { id: editingTask.id, data },
        {
          onSuccess: () => {
            setModalOpen(false);
            setEditingTask(undefined);
            showToast("Tarea actualizada correctamente");
          },
          onError: (e: any) => showToast(e.message, "error"),
        },
      );
    } else {
      createTask.mutate(data, {
        onSuccess: () => {
          setModalOpen(false);
          setEditingTask(undefined);
          showToast("Tarea creada correctamente");
        },
        onError: (e: any) => showToast(e.message, "error"),
      });
    }
  };

  const handleDelete = () => {
    if (!deletingId) return;
    deleteTask.mutate(deletingId, {
      onSuccess: () => {
        setDeletingId(null);
        showToast("Tarea eliminada");
      },
      onError: (e: any) => showToast(e.message, "error"),
    });
  };

  if (authLoading || loading) {
    return <TableSkeleton rows={5} cols={6} />;
  }

  const openNew = () => {
    setEditingTask(undefined);
    setModalOpen(true);
  };
  const subjectName = (id?: string | null) => subjects.find((s) => s.id === id)?.name;
  const counts = {
    pending: tasks.filter((t) => t.status !== "done").length,
    overdue: tasks.filter((t) => t.status !== "done" && daysUntil(t.due_date) < 0).length,
    done: tasks.filter((t) => t.status === "done").length,
  };
  const visible = tasks.filter((t) => {
    if (filter === "pending" && t.status === "done") return false;
    if (filter === "overdue" && !(t.status !== "done" && daysUntil(t.due_date) < 0)) return false;
    if (filter === "done" && t.status !== "done") return false;
    if (subjectFilter && t.subject_id !== subjectFilter) return false;
    if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });
  const toggleDone = (t: Task) =>
    updateTask.mutate({ id: t.id, data: { status: t.status === "done" ? "todo" : "done" } });

  const DueCell: React.FC<{ t: Task }> = ({ t }) => {
    const n = daysUntil(t.due_date);
    const tone = t.status === "done" ? "text-theme-text-muted" : n < 0 ? "text-theme-danger font-medium" : n <= 2 ? "text-theme-warning font-medium" : "text-theme-text-muted";
    return (
      <span className={`text-sm ${tone}`}>
        {formatDay(t.due_date)}
        {t.status !== "done" && <span className="block text-xs">{dueLabel(t.due_date)}</span>}
      </span>
    );
  };

  const Check: React.FC<{ t: Task }> = ({ t }) => (
    <button
      onClick={() => toggleDone(t)}
      aria-label={t.status === "done" ? `Marcar "${t.title}" como pendiente` : `Marcar "${t.title}" como hecha`}
      className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center cursor-pointer p-0 ${
        t.status === "done" ? "border-theme-success bg-theme-success text-white" : "border-theme-border bg-transparent hover:border-theme-success"
      }`}
    >
      {t.status === "done" && <CheckIcon size={12} strokeWidth={3} />}
    </button>
  );

  const Actions: React.FC<{ t: Task }> = ({ t }) => (
    <div className="flex justify-end items-center">
      <IconButton label={`Editar tarea ${t.title}`} onClick={() => { setEditingTask(t); setModalOpen(true); }}>
        <Pencil size={16} />
      </IconButton>
      <IconButton label={`Eliminar tarea ${t.title}`} danger onClick={() => setDeletingId(t.id)}>
        <Trash2 size={16} />
      </IconButton>
    </div>
  );

  const chips: { key: typeof filter; label: string; n?: number }[] = [
    { key: "pending", label: "Pendientes", n: counts.pending },
    { key: "overdue", label: "Vencidas", n: counts.overdue },
    { key: "done", label: "Hechas", n: counts.done },
    { key: "all", label: "Todas", n: tasks.length },
  ];

  return (
    <>
      <div>
        <PageHeader
          title="Tareas"
          subtitle={counts.overdue ? `${counts.pending} pendientes · ${counts.overdue} vencidas` : `${counts.pending} pendientes`}
          actions={
            <Button onClick={openNew} aria-label="Nueva Tarea">
              <Plus size={16} className="mr-1.5" /> Nueva tarea
            </Button>
          }
        />

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrar tareas">
            {chips.map((c) => (
              <button
                key={c.key}
                role="tab"
                aria-selected={filter === c.key}
                onClick={() => setFilter(c.key)}
                className={`h-9 px-3 rounded-full text-sm whitespace-nowrap border cursor-pointer transition-colors ${
                  filter === c.key
                    ? "bg-theme-primary text-theme-bg border-transparent"
                    : "bg-theme-card-bg text-theme-text-muted border-theme-border hover:text-theme-text"
                } ${c.key === "overdue" && c.n ? (filter === c.key ? "" : "text-theme-danger") : ""}`}
              >
                {c.label} <span className="opacity-70">{c.n}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 sm:ml-auto min-w-0">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              aria-label="Buscar tareas"
              className="h-9 px-3 rounded-lg border border-theme-border bg-theme-card-bg text-theme-text text-sm flex-1 min-w-0 sm:w-44 focus:outline-none focus:ring-2 focus:ring-theme-accent/15"
            />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              aria-label="Filtrar por UC"
              className="h-9 px-2 rounded-lg border border-theme-border bg-theme-card-bg text-theme-text text-sm max-w-40 min-w-0"
            >
              <option value="">Todas las UC</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className={`${cardCls} p-6`}>
            <EmptyState
              title="Sin tareas pendientes"
              description="Empezá sumando tareas vinculadas a tus UC para tener tu agenda al día."
              actionLabel="+ Crear nueva tarea"
              onAction={openNew}
              icon={<CheckSquare className="w-8 h-8 opacity-50" strokeWidth={1.5} />}
            />
          </div>
        ) : visible.length === 0 ? (
          <div className={`${cardCls} p-8 text-center text-sm text-theme-text-muted`}>No hay tareas con este filtro.</div>
        ) : (
          <>
            {/* Desktop: tabla */}
            <div className={`${cardCls} hidden md:block overflow-hidden`}>
              <table className="w-full border-collapse" aria-label="Lista de tareas">
                <thead>
                  <tr className="bg-theme-bg">
                    <th className="w-10 px-4 py-2.5" aria-label="Hecha" />
                    {["Tarea", "Vence", "Tipo", "Estado", "Nota"].map((h) => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-theme-text-muted">{h}</th>
                    ))}
                    <th className="w-24" aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((t) => (
                    <tr key={t.id} className="border-t border-theme-border hover:bg-theme-bg/60 transition-colors">
                      <td className="px-4 py-3"><Check t={t} /></td>
                      <td className="px-3 py-3">
                        <a href={`/tasks/${t.slug || t.id}`} className={`font-medium no-underline hover:underline ${t.status === "done" ? "text-theme-text-muted line-through" : "text-theme-text"}`}>
                          {t.title}
                        </a>
                        {subjectName(t.subject_id) && <span className="block text-xs text-theme-text-muted">{subjectName(t.subject_id)}</span>}
                      </td>
                      <td className="px-3 py-3"><DueCell t={t} /></td>
                      <td className="px-3 py-3 text-sm text-theme-text-muted">{t.type ? TYPE_LABELS[t.type] : "—"}</td>
                      <td className="px-3 py-3"><StatusBadge variant={STATUS_VARIANTS[t.status]}>{STATUS_LABELS[t.status]}</StatusBadge></td>
                      <td className="px-3 py-3 text-sm font-semibold">{t.grade != null ? t.grade : "—"}</td>
                      <td className="px-2 py-3"><Actions t={t} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: tarjetas */}
            <ul className="md:hidden list-none m-0 p-0 flex flex-col gap-2" aria-label="Lista de tareas">
              {visible.map((t) => (
                <li key={t.id} className={`${cardCls} p-4 flex items-start gap-3`}>
                  <div className="pt-0.5"><Check t={t} /></div>
                  <div className="flex-1 min-w-0">
                    <a href={`/tasks/${t.slug || t.id}`} className={`block font-medium no-underline ${t.status === "done" ? "text-theme-text-muted line-through" : "text-theme-text"}`}>
                      {t.title}
                    </a>
                    <span className="block text-xs text-theme-text-muted mb-2">
                      {[subjectName(t.subject_id), t.type ? TYPE_LABELS[t.type] : null, t.grade != null ? `Nota ${t.grade}` : null].filter(Boolean).join(" · ")}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge variant={STATUS_VARIANTS[t.status]}>{STATUS_LABELS[t.status]}</StatusBadge>
                      <DueCell t={t} />
                    </div>
                  </div>
                  <div className="-mr-2 -mt-1"><Actions t={t} /></div>
                </li>
              ))}
            </ul>
          </>
        )}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingTask ? "Editar Tarea" : "Nueva Tarea"}
        >
          <TaskForm
            initialData={editingTask}
            subjects={subjects}
            onSubmit={handleSubmit}
            onCancel={() => setModalOpen(false)}
            loading={createTask.isPending || updateTask.isPending}
          />
        </Modal>
      </div>

      <ConfirmModal
        isOpen={!!deletingId}
        title="Eliminar Tarea"
        description="¿Estás seguro de que deseas eliminar esta tarea de forma permanente? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar tarea"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        isLoading={deleteTask.isPending}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </>
  );
};
