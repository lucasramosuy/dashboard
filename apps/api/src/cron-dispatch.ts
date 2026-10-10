// Una expresión para Cloudflare y Bun. Montevideo:00/07/20 = UTC03/10/23.
export const DASHBOARD_CRON_UTC = "0 3,10,23 * * *";
export type CronAction = "ical" | "daily" | "weekly";
export function cronAction(scheduledTime: number): CronAction | null {
  const date = new Date(scheduledTime);
  if (!Number.isFinite(date.getTime())) return null;
  const hour = date.getUTCHours();
  if (hour === 3) return "ical";
  if (hour === 10) return "daily";
  if (hour === 23 && date.getUTCDay() === 0) return "weekly";
  return null;
}
export async function dispatchCron(
  scheduledTime: number,
  actions: Record<CronAction, (now: Date) => Promise<void>>,
): Promise<void> {
  const action = cronAction(scheduledTime);
  if (action) await actions[action](new Date(scheduledTime));
}
