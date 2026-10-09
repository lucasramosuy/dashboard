import { describe, expect, test } from "bun:test";
import { nextAction, type Task, type Subject } from "@dashboard/shared-types";

const task = (id: string, date: string, status: Task["status"] = "todo"): Task => ({
  id,
  title: id,
  due_date: new Date(`${date}T00:00:00Z`),
  status,
  subject_id: "uc",
});
const subjects: Subject[] = [{ id: "uc", name: "Didáctica", user_id: "u", total_classes: 20 }];
const today = "2026-10-09";

describe("próxima acción", () => {
  test("sin pendientes no inventa una acción", () => {
    expect(nextAction([], subjects, today)).toBeNull();
    expect(nextAction([task("done", today, "done")], subjects, today)).toBeNull();
  });
  test("prioriza vencida más antigua antes de próximas", () => {
    const result = nextAction(
      [task("soon", "2026-10-10"), task("late", "2026-10-07"), task("older", "2026-10-06")],
      subjects,
      today,
    );
    expect(result?.task.id).toBe("older");
    expect(result?.reason).toBe("Venció hace 3 días");
    expect(result?.subjectName).toBe("Didáctica");
  });
  test("hoy y mañana se calculan por día calendario sin desplazar medianoche UTC", () => {
    expect(nextAction([task("today", today)], subjects, today)?.reason).toBe("Vence hoy");
    expect(nextAction([task("tomorrow", "2026-10-10")], subjects, today)?.reason).toBe(
      "Vence mañana",
    );
  });
  test("a igual fecha prefiere en curso y desempata por ID", () => {
    expect(
      nextAction(
        [task("a", today), task("c", today, "in-progress"), task("b", today, "in-progress")],
        subjects,
        today,
      )?.task.id,
    ).toBe("b");
  });
  test("incluye tareas sin UC y planner; omite fecha inválida", () => {
    const plain = { ...task("planner", "2026-10-12"), subject_id: null, is_planner: true };
    expect(
      nextAction([{ ...task("bad", today), due_date: new Date("invalid") }, plain], subjects, today)
        ?.subjectName,
    ).toBeNull();
    expect(nextAction([plain], subjects, today)?.reason).toBe("Vence en 3 días");
  });
});
