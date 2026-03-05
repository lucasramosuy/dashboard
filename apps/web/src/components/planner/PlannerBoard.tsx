import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Task } from "@dashboard/shared-types";
import { Modal } from "../ui/Modal";
import { PlannerSkeleton } from "../ui/Skeleton";

export function PlannerBoard() {
  const queryClient = useQueryClient();

  // ----- ESTADO: SEMANA ACTUAL -----
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay() || 7;
    if (day !== 1) today.setHours(-24 * (day - 1));
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const { weekStartIso, weekEndIso, daysOfWeek } = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    const end = new Date(days[6]);
    end.setHours(23, 59, 59, 999);
    return {
      weekStartIso: currentWeekStart.toISOString(),
      weekEndIso: end.toISOString(),
      daysOfWeek: days,
    };
  }, [currentWeekStart]);

  // ----- FETCH DATOS -----
  const { data: groupedTasks = {}, isLoading } = useQuery({
    queryKey: ["plannerTasks", weekStartIso, weekEndIso],
    queryFn: () => api.getWeeklyTasks(weekStartIso, weekEndIso),
  });

  // ----- MUTACIONES -----
  const updateTaskDateMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      api.updateTask(id, { due_date: new Date(date) }),
    onMutate: async ({ id, date }) => {
      await queryClient.cancelQueries({ queryKey: ["plannerTasks", weekStartIso, weekEndIso] });
      const previousTasks = queryClient.getQueryData(["plannerTasks", weekStartIso, weekEndIso]);
      queryClient.setQueryData(["plannerTasks", weekStartIso, weekEndIso], (old: any) => {
        if (!old) return old;
        const newGrouped: Record<string, Task[]> = {};
        let taskToMove: Task | undefined;
        for (const [dayKey, tasks] of Object.entries(old)) {
          newGrouped[dayKey] = (tasks as Task[]).filter((t) => {
            if (t.id === id) {
              taskToMove = t;
              return false;
            }
            return true;
          });
        }
        if (taskToMove) {
          if (!newGrouped[date]) newGrouped[date] = [];
          newGrouped[date].push({ ...taskToMove, due_date: new Date(date) });
        }
        return newGrouped;
      });
      return { previousTasks };
    },
    onError: (_err, _newTodo, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["plannerTasks", weekStartIso, weekEndIso], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["plannerTasks", weekStartIso, weekEndIso] });
    },
  });

  const toggleTaskStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task["status"] }) =>
      api.updateTaskStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["plannerTasks", weekStartIso, weekEndIso] });
      const previousTasks = queryClient.getQueryData(["plannerTasks", weekStartIso, weekEndIso]);
      queryClient.setQueryData(["plannerTasks", weekStartIso, weekEndIso], (old: any) => {
        if (!old) return old;
        const newGrouped: Record<string, Task[]> = {};
        for (const [dayKey, tasks] of Object.entries(old)) {
          newGrouped[dayKey] = (tasks as Task[]).map((t) => {
            if (t.id === id) return { ...t, status };
            return t;
          });
        }
        return newGrouped;
      });
      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["plannerTasks", weekStartIso, weekEndIso], context.previousTasks);
      }
    },
  });

  // ----- DRAG AND DROP -----
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    e.currentTarget.classList.add("dragging");
  };
  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("dragging");
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) updateTaskDateMutation.mutate({ id: taskId, date: `${dateKey}T12:00:00.000Z` });
  };

  // ----- NAVEGACIÓN -----
  const navPrevWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() - 7);
    setCurrentWeekStart(next);
  };
  const navNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };
  const navCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay() || 7;
    if (day !== 1) today.setHours(-24 * (day - 1));
    today.setHours(0, 0, 0, 0);
    setCurrentWeekStart(today);
  };

  const todayKey = new Date().toISOString().split("T")[0];

  const getDayName = (d: Date) => d.toLocaleDateString("es-UY", { weekday: "long" });
  const getFullDate = (d: Date) =>
    d.toLocaleDateString("es-UY", { day: "numeric", month: "long", year: "numeric" });

  // ----- NUEVA TAREA -----
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [newTaskDate, setNewTaskDate] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const createTaskMutation = useMutation({
    mutationFn: (data: Partial<Task>) => api.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plannerTasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setTaskModalOpen(false);
      setNewTaskTitle("");
    },
  });

  const openNewTaskModal = (dateKey: string) => {
    setNewTaskDate(dateKey);
    setTaskModalOpen(true);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    createTaskMutation.mutate({
      title: newTaskTitle,
      due_date: new Date(`${newTaskDate}T12:00:00Z`),
      status: "todo",
      is_planner: true,
    });
  };

  // ----- TASK DETAIL MODAL -----
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  if (isLoading) {
    return <PlannerSkeleton />;
  }

  return (
    <div className="planner-root">
      <style dangerouslySetInnerHTML={{ __html: PLANNER_CSS }} />

      {/* Flecha izquierda */}
      <button
        className="planner-nav-arrow planner-nav-arrow--left"
        onClick={navPrevWeek}
        title="Semana anterior"
      >
        ‹
      </button>

      {/* Contenido central */}
      <div className="planner-center">
        {/* Header de navegación */}
        <header className="planner-header">
          <button className="planner-today-btn" onClick={navCurrentWeek}>
            Hoy
          </button>
          {updateTaskDateMutation.isPending && (
            <span className="text-theme-text-muted text-xs">Guardando...</span>
          )}
        </header>

        {/* Grilla de días */}
        <div className="planner-grid">
          {daysOfWeek.map((day) => {
            const dateKey = day.toISOString().split("T")[0];
            const dayTasks = groupedTasks[dateKey] || [];
            const isToday = dateKey === todayKey;

            return (
              <div
                key={dateKey}
                className={`planner-col ${isToday ? "planner-col--today" : ""}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, dateKey)}
              >
                {/* Header del día */}
                <div className="planner-col__header">
                  <h3 className={`planner-col__day ${isToday ? "planner-col__day--today" : ""}`}>
                    {getDayName(day)}
                  </h3>
                  <span className="planner-col__date">{getFullDate(day)}</span>
                  <button
                    className="planner-col__add"
                    onClick={() => openNewTaskModal(dateKey)}
                    title="Agregar tarea"
                  >
                    +
                  </button>
                </div>

                {/* Lista de tareas */}
                <div className="planner-col__tasks">
                  {dayTasks.map((task) => {
                    const isDone = task.status === "done";
                    return (
                      <div
                        key={task.id}
                        className={`planner-item ${isDone ? "planner-item--done" : ""}`}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <button
                          className={`planner-item__check ${isDone ? "planner-item__check--done" : ""}`}
                          onClick={() =>
                            toggleTaskStatusMutation.mutate({
                              id: task.id,
                              status: isDone ? "todo" : "done",
                            })
                          }
                          aria-label={isDone ? "Marcar como pendiente" : "Marcar como completada"}
                        >
                          {isDone && (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                        <span
                          className="planner-item__title"
                          onClick={() => setSelectedTask(task)}
                          title="Click para ver detalles"
                        >
                          {task.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flecha derecha */}
      <button
        className="planner-nav-arrow planner-nav-arrow--right"
        onClick={navNextWeek}
        title="Semana siguiente"
      >
        ›
      </button>

      {/* Modal nueva tarea */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setTaskModalOpen(false)} title={`Nueva tarea`}>
        <form onSubmit={handleCreateTask} className="flex flex-col gap-4 mt-3">
          <div>
            <label className="block mb-1 text-sm text-theme-text-muted">Título</label>
            <input
              type="text"
              className="w-full px-3 py-2.5 rounded-lg border border-theme-border bg-theme-card-bg text-theme-text text-sm transition-all duration-200 focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/15 hover:border-theme-accent"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Ej. Leer capítulo 3"
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-5 py-2.5 rounded-lg font-semibold border border-theme-border bg-transparent text-theme-text hover:bg-theme-bg hover:border-theme-accent cursor-pointer transition-all duration-150"
              onClick={() => setTaskModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg font-semibold border border-transparent bg-theme-primary text-theme-bg hover:bg-theme-accent cursor-pointer transition-all duration-150 disabled:opacity-45 disabled:cursor-not-allowed"
              disabled={createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? "Agregando..." : "Agregar"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal detalle de tarea */}
      {selectedTask && (
        <div className="planner-detail-overlay" onClick={() => setSelectedTask(null)}>
          <div className="planner-detail" onClick={(e) => e.stopPropagation()}>
            <div className="planner-detail__header">
              <span className="planner-detail__date">
                📅{" "}
                {selectedTask.due_date
                  ? new Date(selectedTask.due_date).toLocaleDateString("es-UY", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "—"}
              </span>
              <button className="planner-detail__close" onClick={() => setSelectedTask(null)}>
                ×
              </button>
            </div>
            <div className="planner-detail__body">
              <div className="planner-detail__task-row">
                <button
                  className={`planner-item__check ${selectedTask.status === "done" ? "planner-item__check--done" : ""}`}
                  onClick={() => {
                    const newStatus = selectedTask.status === "done" ? "todo" : "done";
                    toggleTaskStatusMutation.mutate({ id: selectedTask.id, status: newStatus });
                    setSelectedTask({ ...selectedTask, status: newStatus });
                  }}
                >
                  {selectedTask.status === "done" && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <span
                  className={`planner-detail__title ${selectedTask.status === "done" ? "planner-detail__title--done" : ""}`}
                >
                  {selectedTask.title}
                </span>
              </div>
              {selectedTask.description && (
                <p className="planner-detail__notes">{selectedTask.description}</p>
              )}
              {!selectedTask.description && (
                <p className="planner-detail__notes planner-detail__notes--empty">Sin notas</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   CSS del Planner — estilo WeekToDo
   Variables actualizadas a --theme-* (Tailwind v4)
   ============================================================ */
const PLANNER_CSS = `
  .planner-root {
    display: flex;
    align-items: stretch;
    height: calc(100vh - 120px);
    position: relative;
    gap: 0;
  }

  /* Flechas laterales */
  .planner-nav-arrow {
    flex-shrink: 0;
    width: 36px;
    background: transparent;
    border: none;
    color: var(--theme-text-muted);
    font-size: 2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s, background 0.15s;
    border-radius: 8px;
    user-select: none;
  }
  .planner-nav-arrow:hover {
    color: var(--theme-text);
    background: var(--theme-card-bg);
  }

  /* Centro */
  .planner-center {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }

  /* Header */
  .planner-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
    flex-shrink: 0;
  }
  .planner-today-btn {
    background: transparent;
    border: 1px solid var(--theme-border);
    color: var(--theme-text);
    padding: 0.35rem 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .planner-today-btn:hover {
    background: var(--theme-card-bg);
    border-color: var(--theme-text-muted);
  }

  /* Grilla de 7 días */
  .planner-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0;
    overflow: hidden;
    border: 1px solid var(--theme-border);
    border-radius: 12px;
    background: var(--theme-card-bg);
  }

  /* Columna del día */
  .planner-col {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--theme-border);
    overflow: hidden;
    min-width: 0;
    background-color: var(--theme-card-bg);
  }
  .planner-col:last-child {
    border-right: none;
  }

  /* Header de columna */
  .planner-col__header {
    padding: 1.25rem 0.75rem 0.75rem;
    text-align: center;
    border-bottom: 2px solid var(--theme-border);
    position: relative;
    flex-shrink: 0;
    background: rgba(255,255,255,0.02);
  }
  .planner-col__day {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    text-transform: capitalize;
    color: var(--theme-text);
    line-height: 1.2;
    letter-spacing: -0.01em;
  }
  .planner-col__day--today {
    color: var(--theme-primary);
  }
  .planner-col__date {
    display: block;
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--theme-text-muted);
    margin-top: 0.25rem;
    opacity: 0.8;
  }
  .planner-col--today {
    box-shadow: inset 0 3px 0 var(--theme-primary);
  }
  .planner-col--today .planner-col__header {
    background: rgba(var(--theme-primary-rgb), 0.05);
  }

  /* Botón agregar (+) */
  .planner-col__add {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: transparent;
    border: none;
    color: var(--theme-text-muted);
    font-size: 1.25rem;
    cursor: pointer;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    line-height: 1;
    opacity: 0.4;
  }
  .planner-col__add:hover {
    background: var(--theme-bg);
    color: var(--theme-primary);
    opacity: 1;
    transform: scale(1.1);
  }

  /* Área de tareas con RAYADO de cuaderno */
  .planner-col__tasks {
    flex: 1;
    overflow-y: auto;
    padding: 0;
    background-image: linear-gradient(var(--theme-border) 1px, transparent 1px);
    background-size: 100% 36px;
    background-attachment: local;
    /* Asegura que el drag and drop detecte toda el área */
    min-height: 100%;
  }

  /* Item de tarea */
  .planner-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0 0.75rem;
    height: 36px; /* Coincide con background-size */
    cursor: grab;
    transition: background 0.15s;
    border-bottom: 1px solid transparent;
  }
  .planner-item:hover {
    background: rgba(var(--theme-primary-rgb), 0.03);
  }
  .planner-item.dragging {
    opacity: 0.4;
    cursor: grabbing;
    background: var(--theme-bg);
  }
  .planner-item--done {
    opacity: 0.6;
  }

  /* Checkbox circular */
  .planner-item__check {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 1.5px solid var(--theme-border);
    background: var(--theme-card-bg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    color: var(--theme-bg);
    transition: all 0.2s ease;
  }
  .planner-item:hover .planner-item__check {
    border-color: var(--theme-primary);
  }
  .planner-item__check--done {
    background: var(--theme-primary);
    border-color: var(--theme-primary);
  }

  /* Título de tarea */
  .planner-item__title {
    flex: 1;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--theme-text);
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-top: 1px;
  }
  .planner-item--done .planner-item__title {
    text-decoration: line-through;
    color: var(--theme-text-muted);
    opacity: 0.8;
  }

  /* ============ DETAIL MODAL ============ */
  .planner-detail-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    animation: fadeIn 0.2s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .planner-detail {
    background: var(--theme-card-bg);
    border: 1px solid var(--theme-border);
    border-radius: 16px;
    width: 100%;
    max-width: 480px;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0,0,0,0.3);
    transform: translateY(0);
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .planner-detail__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--theme-border);
    background: rgba(255,255,255,0.02);
  }
  .planner-detail__date {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--theme-text-muted);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .planner-detail__close {
    background: var(--theme-bg);
    border: 1px solid var(--theme-border);
    color: var(--theme-text-muted);
    font-size: 1.2rem;
    cursor: pointer;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .planner-detail__close:hover {
    color: var(--theme-text);
    background: var(--theme-card-bg);
    transform: rotate(90deg);
  }
  .planner-detail__body {
    padding: 1.5rem;
  }
  .planner-detail__task-row {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .planner-detail__title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--theme-text);
    line-height: 1.4;
    margin-top: -2px;
  }
  .planner-detail__title--done {
    text-decoration: line-through;
    color: var(--theme-text-muted);
  }
  .planner-detail__notes {
    font-size: 0.9rem;
    color: var(--theme-text-muted);
    margin: 0;
    padding: 1rem;
    background: var(--theme-bg);
    border-radius: 12px;
    border: 1px solid var(--theme-border);
    line-height: 1.6;
    white-space: pre-wrap;
  }
  .planner-detail__notes--empty {
    font-style: italic;
    opacity: 0.5;
    text-align: center;
    padding: 2rem 1rem;
  }

  /* ============ RESPONSIVE ============ */
  @media (max-width: 1100px) {
    .planner-grid { grid-template-columns: repeat(5, 1fr); }
    .planner-col:nth-child(n+6) { display: none; }
  }
  @media (max-width: 768px) {
    .planner-grid { grid-template-columns: repeat(3, 1fr); }
    .planner-col:nth-child(n+4) { display: none; }
    .planner-nav-arrow { width: 30px; }
  }
  @media (max-width: 480px) {
    .planner-nav-arrow { display: none; }
    .planner-grid { grid-template-columns: 1fr; }
    .planner-col:not(.planner-col--today) { display: none; }
  }
`;
