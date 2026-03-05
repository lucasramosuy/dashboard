import { dbService } from "../lib/db";
import type { Task } from "@dashboard/shared-types";

export const tasksService = {
  getWeeklyTasks: async (userId: string, startIso: string, endIso: string) => {
    // Obtenemos todas las tareas del usuario (incluyendo las del planner)
    const allTasks = await dbService.tasks.getByUser(userId, true);
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);

    // Normalizamos para agarrar todo el rango horario
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const filtered = allTasks.filter((t) => {
      const taskDate = new Date(t.due_date);
      return taskDate >= startDate && taskDate <= endDate;
    });

    // Agrupar por fecha en string ("YYYY-MM-DD")
    const grouped: Record<string, Task[]> = {};
    for (const task of filtered) {
      const dateKey = new Date(task.due_date).toISOString().split("T")[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    }

    return grouped;
  },
};
