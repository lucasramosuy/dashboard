import { QueryState } from "../ui/QueryState";
import { PlannerMoveForm } from "./PlannerMoveForm";
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Task } from "@dashboard/shared-types";
import { Modal } from "../ui/Modal";
import { PlannerSkeleton } from "../ui/Skeleton";
import "./PlannerBoard.css";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useIcalEvents } from "../../hooks/useDashboardQueries";
import { dayKey, todayKey as localTodayKey } from "../../lib/format";
import { preparePlannerMove } from "../../lib/planner";

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
  const tasksQuery = useQuery({
    queryKey: ["plannerTasks", weekStartIso, weekEndIso],
    queryFn: () => api.getWeeklyTasks(weekStartIso, weekEndIso),
  });

  const { data: groupedTasks = {}, isLoading } = tasksQuery;

  // ----- MUTACIONES -----
  const updateTaskDateMutation = useMutation({
    mutationFn: ({ id, dueDate }: ReturnType<typeof preparePlannerMove>) =>
      api.updateTask(id, { due_date: dueDate }),
    onMutate: async ({ id, date, dueDate }) => {
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
          newGrouped[date].push({ ...taskToMove, due_date: dueDate });
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
      queryClient.invalidateQueries({ queryKey: ["plannerTasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
    if (taskId) updateTaskDateMutation.mutate(preparePlannerMove(taskId, dateKey));
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

  const todayKey = localTodayKey();
  const eventsQuery = useIcalEvents();
  const { data: icalEvents = [] } = eventsQuery;
  const eventsByDay = icalEvents.reduce<Record<string, typeof icalEvents>>((acc, e) => {
    const k = dayKey(e.start_date);
    (acc[k] ||= []).push(e);
    return acc;
  }, {});
  const fmtShort = (d: Date) => d.toLocaleDateString("es-UY", { day: "numeric", month: "short" });
  const weekLabel = `${fmtShort(daysOfWeek[0])} – ${fmtShort(daysOfWeek[6])}`;

  const getDayName = (d: Date) => d.toLocaleDateString("es-UY", { weekday: "long" });
  const getFullDate = (d: Date) =>
    d.toLocaleDateString("es-UY", { day: "numeric", month: "short" });

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
    <QueryState queries={[tasksQuery, eventsQuery]} loading={<PlannerSkeleton />}>
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
            <div className="planner-header__title">
              <p className="eyebrow m-0 mb-3">04 / Planner</p>
              <h1 className="m-0 text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1] text-theme-text">
                Semana del <em>{weekLabel.replace(/\.$/, "")}</em>.
              </h1>
            </div>
            <div className="planner-header__nav">
              <button
                className="planner-icon-btn"
                onClick={navPrevWeek}
                aria-label="Semana anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button className="planner-today-btn" onClick={navCurrentWeek}>
                Hoy
              </button>
              <button
                className="planner-icon-btn"
                onClick={navNextWeek}
                aria-label="Semana siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            {updateTaskDateMutation.isPending && (
              <span className="text-theme-text-muted text-xs">Guardando...</span>
            )}
            {toggleTaskStatusMutation.isError && (
              <span role="alert" className="text-theme-danger text-sm">
                No se pudo cambiar el estado. Se restauró el estado anterior.
              </span>
            )}
            {updateTaskDateMutation.isError && (
              <span role="alert" className="text-theme-danger text-sm">
                No se pudo mover la tarea. Se restauró la fecha anterior.
              </span>
            )}
          </header>

          {/* Grilla de días */}
          <div className="planner-grid">
            {daysOfWeek.map((day) => {
              const dateKey = dayKey(day);
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
                    {(eventsByDay[dateKey] || []).map((ev) => (
                      <div key={ev.id} className="planner-event" title={ev.description || ev.title}>
                        <CalendarDays size={12} className="shrink-0" />
                        <span className="planner-item__title">{ev.title}</span>
                      </div>
                    ))}
                    {dayTasks.length === 0 && !(eventsByDay[dateKey] || []).length && (
                      <span className="planner-empty">Sin tareas</span>
                    )}
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
                          <button
                            type="button"
                            className="planner-item__title planner-title-button"
                            onClick={() => setSelectedTask(task)}
                            title="Click para ver detalles"
                          >
                            {task.title}
                          </button>
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
        <Modal
          isOpen={isTaskModalOpen}
          onClose={() => setTaskModalOpen(false)}
          title={`Nueva tarea`}
        >
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
            {createTaskMutation.isError && (
              <p role="alert" className="text-theme-danger text-sm">
                No se pudo agregar. Tu texto sigue acá; intentá de nuevo.
              </p>
            )}
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
          <Modal isOpen={true} onClose={() => setSelectedTask(null)} title="Detalle de tarea">
            <div>
              <div className="planner-detail__header">
                <span className="planner-detail__date">
                  {selectedTask.due_date
                    ? new Date(selectedTask.due_date).toLocaleDateString("es-UY", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
              <div className="planner-detail__body">
                <div className="planner-detail__task-row">
                  <button
                    className={`planner-item__check ${selectedTask.status === "done" ? "planner-item__check--done" : ""}`}
                    aria-label={
                      selectedTask.status === "done"
                        ? "Marcar como pendiente"
                        : "Marcar como completada"
                    }
                    disabled={toggleTaskStatusMutation.isPending}
                    onClick={() => {
                      const newStatus = selectedTask.status === "done" ? "todo" : "done";
                      toggleTaskStatusMutation.mutate(
                        { id: selectedTask.id, status: newStatus },
                        {
                          onSuccess: () => setSelectedTask({ ...selectedTask, status: newStatus }),
                        },
                      );
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
              <PlannerMoveForm
                key={selectedTask.id}
                date={dayKey(selectedTask.due_date)}
                pending={updateTaskDateMutation.isPending}
                onMove={(date) =>
                  updateTaskDateMutation.mutate(preparePlannerMove(selectedTask.id, date), {
                    onSuccess: () => setSelectedTask(null),
                  })
                }
              />
              {updateTaskDateMutation.isError && (
                <p role="alert" className="text-theme-danger text-sm">
                  No se pudo mover. La fecha anterior sigue guardada.
                </p>
              )}
              {toggleTaskStatusMutation.isError && (
                <p role="alert" className="text-theme-danger text-sm">
                  No se pudo cambiar el estado. Se restauró el estado anterior.
                </p>
              )}
            </div>
          </Modal>
        )}
      </div>
    </QueryState>
  );
}
