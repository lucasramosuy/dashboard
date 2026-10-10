import { describe, expect, test } from "bun:test";
import { cronAction, dispatchCron, DASHBOARD_CRON_UTC, type CronAction } from "../src/cron-dispatch";
const time = (value: string) => new Date(value).getTime();
describe("Cron consolidado", () => {
  test("una expresión preserva los tres horarios UTC", () => {
    expect(DASHBOARD_CRON_UTC).toBe("0 3,10,23 * * *");
    expect(cronAction(time("2026-10-09T03:00:00Z"))).toBe("ical");
    expect(cronAction(time("2026-10-09T10:00:00Z"))).toBe("daily");
    expect(cronAction(time("2026-10-11T23:00:00Z"))).toBe("weekly");
  });
  test("23UTC no hace nada lunes-sábado ni en horario extraño", () => {
    for (let day = 5; day <= 10; day++) expect(cronAction(time(`2026-10-${String(day).padStart(2, "0")}T23:00:00Z`))).toBeNull();
    expect(cronAction(time("2026-10-11T20:00:00Z"))).toBeNull();
    expect(cronAction(NaN)).toBeNull();
  });
  test("despacha solo una tarea usando scheduledTime incluso si llega demorada", async () => {
    const called: { action: CronAction; now: number }[] = [];
    const actions = Object.fromEntries((["ical", "daily", "weekly"] as const).map(action => [action, async (now: Date) => { called.push({ action, now: now.getTime() }); }])) as Record<CronAction, (now: Date) => Promise<void>>;
    for (const stamp of ["2026-10-09T03:00:00Z", "2026-10-09T10:00:00Z", "2026-10-11T23:00:00Z", "2026-10-10T23:00:00Z"]) await dispatchCron(time(stamp), actions);
    expect(called.map(c => c.action)).toEqual(["ical", "daily", "weekly"]);
    expect(called[2].now).toBe(time("2026-10-11T23:00:00Z"));
  });
  test("propaga falla para que cron no reporte éxito falso", async () => {
    const fail = async () => { throw new Error("failed"); };
    await expect(dispatchCron(time("2026-10-09T03:00:00Z"), { ical: fail, daily: fail, weekly: fail })).rejects.toThrow("failed");
  });
});
