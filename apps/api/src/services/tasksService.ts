import { dbService } from "../lib/db";
import type { Task } from "@dashboard/shared-types";

export const tasksService = {
  getWeeklyTasks: async (userId: string, startIso: string, endIso: string) => {
    // PERF-1: fetch only tasks within the date range at the DB level
    const tasks = await dbService.tasks.getByUserAndDateRange(userId, startIso, endIso, true);

    // Agrupar por fecha en string ("YYYY-MM-DD")
    const grouped: Record<string, Task[]> = {};
    for (const task of tasks) {
      const dateKey = new Date(task.due_date).toISOString().split("T")[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    }

    return grouped;
  },
};
