import { expect, test } from "bun:test";
import { taskStage } from "@dashboard/shared-types";

test("proyecta los tres estados existentes a cuatro columnas", () => {
  expect(taskStage({ status: "todo" })).toBe("pending");
  expect(taskStage({ status: "in-progress" })).toBe("progress");
  expect(taskStage({ status: "done", grade: null })).toBe("submitted");
  expect(taskStage({ status: "done", grade: 9 })).toBe("graded");
});
test("cero es nota, no ausencia; una tarea abierta con nota sigue abierta", () => {
  expect(taskStage({ status: "done", grade: 0 })).toBe("graded");
  expect(taskStage({ status: "todo", grade: 9 })).toBe("pending");
  expect(taskStage({ status: "in-progress", grade: 9 })).toBe("progress");
});
