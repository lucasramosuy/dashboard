import { describe, test, expect } from "bun:test";
import { preparePlannerMove } from "../src/lib/planner";
import { dayKey } from "../src/lib/format";

describe("reprogramación del planner", () => {
  test.each(["2026-10-03", "2026-10-04", "2026-10-31", "2026-11-01", "2026-12-31", "2027-01-01", "2028-02-29"])(
    "el drop conserva el día %s y normaliza una sola vez", (date) => {
      const move = preparePlannerMove("demo-task", date);
      expect(move.id).toBe("demo-task");
      expect(move.date).toBe(date);
      expect(move.dueDate.toISOString()).toBe(`${date}T12:00:00.000Z`);
      expect(JSON.parse(JSON.stringify({ due_date: move.dueDate })).due_date).toBe(`${date}T12:00:00.000Z`);
      expect(dayKey(move.dueDate)).toBe(date);
    },
  );
  test.each(["2026-10-03T12:00:00.000Z", "invalid", "2026-02-30", "2026-13-01", "2027-02-29"])(
    "rechaza la fecha %s antes de llamar a la API", (date) => {
      expect(() => preparePlannerMove("demo-task", date)).toThrow();
    },
  );
});
