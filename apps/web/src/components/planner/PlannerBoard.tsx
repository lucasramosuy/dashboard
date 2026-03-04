import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Task } from "@dashboard/shared-types";
import { Modal } from "../Modal";
import { useAuth } from "../../contexts/AuthContext";

export function PlannerBoard() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window !== "undefined" && !authLoading && !user) {
      window.location.replace("/login");
    }
  }, [user, authLoading]);

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
    });
  };

  // ----- TASK DETAIL MODAL -----
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  if (isLoading) {
    return (
      <div className="oat-spinner-wrapper" aria-busy="true" aria-label="Cargando planner">
        <div className="oat-spinner" />
      </div>
    );
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
            <span style={{ color: "var(--oat-text-muted)", fontSize: "0.8rem" }}>Guardando...</span>
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
                  {/* Líneas divisorias tipo libreta */}
                  {Array.from({ length: Math.max(0, 8 - dayTasks.length) }).map((_, i) => (
                    <div key={`line-${i}`} className="planner-col__line" />
                  ))}
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
        <form
          onSubmit={handleCreateTask}
          style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.75rem" }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.4rem",
                fontSize: "0.85rem",
                color: "var(--oat-text-muted)",
              }}
            >
              Título
            </label>
            <input
              type="text"
              className="oat-input"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Ej. Leer capítulo 3"
              autoFocus
              required
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button
              type="button"
              className="oat-btn oat-btn-outline"
              onClick={() => setTaskModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="oat-btn oat-btn-primary"
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
    color: var(--oat-text-muted);
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
    color: var(--oat-text);
    background: var(--oat-card-bg);
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
    border: 1px solid var(--oat-border);
    color: var(--oat-text);
    padding: 0.35rem 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .planner-today-btn:hover {
    background: var(--oat-card-bg);
    border-color: var(--oat-text-muted);
  }

  /* Grilla de 7 días */
  .planner-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0;
    overflow: hidden;
    border: 1px solid var(--oat-border);
    border-radius: 12px;
    background: var(--oat-card-bg);
  }

  /* Columna del día */
  .planner-col {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--oat-border);
    overflow: hidden;
    min-width: 0;
  }
  .planner-col:last-child {
    border-right: none;
  }

  /* Header de columna */
  .planner-col__header {
    padding: 1rem 0.75rem 0.75rem;
    text-align: center;
    border-bottom: 1px solid var(--oat-border);
    position: relative;
    flex-shrink: 0;
  }
  .planner-col__day {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    text-transform: capitalize;
    color: var(--oat-text);
    line-height: 1.3;
  }
  .planner-col__day--today {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .planner-col__date {
    display: block;
    font-size: 0.75rem;
    color: var(--oat-text-muted);
    margin-top: 0.15rem;
  }
  .planner-col--today .planner-col__header {
    background: rgba(255,255,255,0.03);
  }

  /* Botón agregar (+) */
  .planner-col__add {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: transparent;
    border: none;
    color: var(--oat-text-muted);
    font-size: 1.1rem;
    cursor: pointer;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background 0.15s, color 0.15s;
    line-height: 1;
  }
  .planner-col__add:hover {
    background: var(--oat-bg);
    color: var(--oat-text);
  }

  /* Área de tareas */
  .planner-col__tasks {
    flex: 1;
    overflow-y: auto;
    padding: 0;
  }

  /* Item de tarea */
  .planner-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--oat-border);
    cursor: grab;
    transition: background 0.1s;
    min-height: 32px;
  }
  .planner-item:hover {
    background: var(--oat-bg);
  }
  .planner-item.dragging {
    opacity: 0.4;
    cursor: grabbing;
  }
  .planner-item--done {
    opacity: 0.55;
  }

  /* Checkbox circular */
  .planner-item__check {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 1.5px solid var(--oat-border);
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    color: var(--oat-bg);
    transition: border-color 0.15s, background 0.15s;
  }
  .planner-item__check:hover {
    border-color: var(--oat-text-muted);
  }
  .planner-item__check--done {
    background: var(--oat-text-muted);
    border-color: var(--oat-text-muted);
  }

  /* Título de tarea */
  .planner-item__title {
    flex: 1;
    font-size: 0.85rem;
    line-height: 1.3;
    color: var(--oat-text);
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .planner-item--done .planner-item__title {
    text-decoration: line-through;
    color: var(--oat-text-muted);
  }

  /* Líneas vacías tipo libreta */
  .planner-col__line {
    border-bottom: 1px solid var(--oat-border);
    min-height: 32px;
    opacity: 0.5;
  }

  /* ============ DETAIL MODAL ============ */
  .planner-detail-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  .planner-detail {
    background: var(--oat-card-bg);
    border: 1px solid var(--oat-border);
    border-radius: 12px;
    width: 100%;
    max-width: 520px;
    overflow: hidden;
    box-shadow: 0 16px 48px rgba(0,0,0,0.2);
  }
  .planner-detail__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.25rem;
    border-bottom: 1px solid var(--oat-border);
  }
  .planner-detail__date {
    font-size: 0.85rem;
    color: var(--oat-text-muted);
  }
  .planner-detail__close {
    background: transparent;
    border: none;
    color: var(--oat-text-muted);
    font-size: 1.4rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }
  .planner-detail__close:hover {
    color: var(--oat-text);
  }
  .planner-detail__body {
    padding: 1.25rem;
  }
  .planner-detail__task-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .planner-detail__title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--oat-text);
  }
  .planner-detail__title--done {
    text-decoration: line-through;
    color: var(--oat-text-muted);
  }
  .planner-detail__notes {
    font-size: 0.85rem;
    color: var(--oat-text-muted);
    margin: 0;
    padding-top: 0.75rem;
    border-top: 1px solid var(--oat-border);
    line-height: 1.5;
    white-space: pre-wrap;
  }
  .planner-detail__notes--empty {
    font-style: italic;
    opacity: 0.6;
  }

  /* ============ RESPONSIVE ============ */
  @media (max-width: 900px) {
    .planner-grid {
      grid-template-columns: repeat(5, 1fr);
    }
    .planner-col:nth-child(n+6) {
      display: none;
    }
  }
  @media (max-width: 600px) {
    .planner-nav-arrow { display: none; }
    .planner-grid {
      grid-template-columns: repeat(3, 1fr);
    }
    .planner-col:nth-child(n+4) {
      display: none;
    }
    .planner-col__day { font-size: 0.85rem; }
    .planner-col__date { font-size: 0.65rem; }
  }
`;
