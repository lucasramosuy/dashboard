import { db, dbService } from "../lib/db";
import { attendanceInfo, subjectHealth } from "@dashboard/shared-types";
import { activityWindow } from "../routes/activity";

export const WEEKLY_CRON_UTC = "0 23 * * 0";
export interface WeeklySummary {
  week_start: string;
  generated_at: string;
  activity_count: number;
  subjects: {
    id: string; name: string; level: string; reasons: string[];
    attendance: number; average: number | null; pending: number;
  }[];
}

export async function buildWeeklySummary(userId: string, now = new Date()): Promise<WeeklySummary> {
  const [subjects, tasks, absences] = await Promise.all([
    dbService.subjects.getAll(userId), dbService.tasks.getByUser(userId), dbService.absences.getByUser(userId),
  ]);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Montevideo" }).format(now);
  const window = activityWindow("week", now);
  const count = await db.execute({
    sql: "SELECT count(*) AS n FROM activity_log WHERE user_id = ? AND created_at >= ? AND created_at <= ?",
    args: [userId, window.start, now.toISOString()],
  });
  return {
    week_start: window.start.slice(0, 10), generated_at: now.toISOString(), activity_count: Number(count.rows[0].n),
    subjects: subjects.map((subject) => {
      const ownTasks = tasks.filter((t) => t.subject_id === subject.id);
      const ownAbsences = absences.filter((a) => a.subject_id === subject.id);
      const health = subjectHealth({ subject, tasks: ownTasks, absences: ownAbsences, today });
      const grades = ownTasks.map((t) => t.grade).filter((g): g is number => g != null);
      return {
        id: subject.id, name: subject.name, level: health.level, reasons: health.reasons.map((r) => r.text),
        attendance: attendanceInfo(subject.total_classes, ownAbsences.reduce((n, a) => n + a.calculated_value, 0)).percentage,
        average: grades.length ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length * 10) / 10 : null,
        pending: ownTasks.filter((t) => t.status !== "done").length,
      };
    }).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

// Solo datos privados en su panel. UPSERT por usuario/semana evita duplicados por reintento.
export async function saveWeeklySummary(userId: string, now = new Date()) {
  const summary = await buildWeeklySummary(userId, now);
  await db.batch([
    { sql: `INSERT INTO weekly_summary(user_id, week_start, generated_at, payload) VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, week_start) DO UPDATE SET generated_at=excluded.generated_at, payload=excluded.payload`,
      args: [userId, summary.week_start, summary.generated_at, JSON.stringify(summary)] },
    { sql: `DELETE FROM weekly_summary WHERE user_id = ? AND week_start NOT IN
            (SELECT week_start FROM weekly_summary WHERE user_id = ? ORDER BY week_start DESC LIMIT 12)`, args: [userId, userId] },
  ], "write");
}

export async function runWeeklySummary(now = new Date()) {
  const users = await db.execute("SELECT id FROM user ORDER BY id");
  for (const user of users.rows) await saveWeeklySummary(String(user.id), now);
}
