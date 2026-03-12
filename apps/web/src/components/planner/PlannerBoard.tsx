import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Task } from "@dashboard/shared-types";
import { Modal } from "../ui/Modal";
import { PlannerSkeleton } from "../ui/Skeleton";
import "./PlannerBoard.css";

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
