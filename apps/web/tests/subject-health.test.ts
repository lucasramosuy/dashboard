import { describe, test, expect } from "bun:test";
import { subjectHealth, daysBetween } from "@dashboard/shared-types";

const TODAY = "2026-10-04";
const subject = { total_classes: 40 };
const task = (title: string, due_date: string, status = "todo", grade: number | null = null) =>
  ({ title, due_date, status, grade }) as never;
const run = (over: { absences?: number; tasks?: never[] } = {}) =>
  subjectHealth({
    subject,
    absences: over.absences ? [{ calculated_value: over.absences }] : [],
    tasks: over.tasks ?? [],
    today: TODAY,
  });

describe("subjectHealth", () => {
  test("sin señales: al día", () => {
    const h = run({ tasks: [task("TP", "2026-11-30")] });
    expect(h.level).toBe("ok");
    expect(h.reasons).toHaveLength(0);
  });

  test("sin clases ni tareas: vacío", () => {
    const h = subjectHealth({
      subject: { total_classes: 0 },
      absences: [],
      tasks: [],
      today: TODAY,
    });
    expect(h.empty).toBe(true);
    expect(h.level).toBe("ok");
  });

  test("faltas al límite: riesgo", () => {
    const h = run({ absences: 10 });
    expect(h.level).toBe("risk");
    expect(h.reasons[0].signal).toBe("attendance");
  });

  test("quedan pocas faltas: atención", () => {
    const h = run({ absences: 8.5 });
    expect(h.level).toBe("attention");
    expect(h.reasons[0].text).toBe("Te quedan 1,5 faltas");
  });

  test("una tarea vencida: atención; dos: riesgo", () => {
    expect(run({ tasks: [task("A", "2026-10-01")] }).level).toBe("attention");
    expect(run({ tasks: [task("A", "2026-10-01"), task("B", "2026-10-02")] }).level).toBe("risk");
  });

  test("tareas hechas no cuentan como vencidas", () => {
    expect(run({ tasks: [task("A", "2026-10-01", "done")] }).level).toBe("ok");
  });

  test("entrega próxima: dentro de 3 días sí, a los 4 no", () => {
    const soon = run({ tasks: [task("Parcial", "2026-10-07")] });
    expect(soon.level).toBe("attention");
    expect(soon.reasons[0].text).toBe("Parcial vence en 3 días");
    expect(run({ tasks: [task("Parcial", "2026-10-08")] }).level).toBe("ok");
  });

  test("entrega próxima en curso no avisa", () => {
    expect(run({ tasks: [task("TP", "2026-10-05", "in-progress")] }).level).toBe("ok");
  });

  test("promedio menor a 9: atención con razón", () => {
    const h = run({
      tasks: [task("P1", "2026-09-01", "done", 7), task("P2", "2026-09-10", "done", 8)],
    });
    expect(h.level).toBe("attention");
    expect(h.reasons[0].text).toBe("Promedio 7,5, exonerás con 9");
  });

  test("promedio 9 o más no pesa; sin notas tampoco", () => {
    expect(run({ tasks: [task("P1", "2026-09-01", "done", 9)] }).level).toBe("ok");
    expect(run({ tasks: [task("P1", "2026-09-01", "done")] }).level).toBe("ok");
  });

  test("el nivel es el peor y el riesgo va primero", () => {
    const h = run({ absences: 10, tasks: [task("P1", "2026-09-01", "done", 5)] });
    expect(h.level).toBe("risk");
    expect(h.reasons[0].level).toBe("risk");
  });

  test("daysBetween", () => {
    expect(daysBetween(TODAY, "2026-10-04")).toBe(0);
    expect(daysBetween(TODAY, "2026-10-01")).toBe(-3);
  });
});
