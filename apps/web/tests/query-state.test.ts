import { describe, expect, test } from "bun:test";
import { readState, firstRunStep } from "../src/lib/query-state";
const read = (state: object = {}) => ({ data: undefined, refetch: () => {}, ...state });
describe("estados de lectura", () => {
  test("carga inicial no es vacío", () =>
    expect(readState([read({ isPending: true })])).toBe("loading"));
  test("vacío real está listo", () => expect(readState([read({ data: [] })])).toBe("ready"));
  test("fallo inicial bloquea métricas", () =>
    expect(readState([read({ isError: true })])).toBe("error"));
  test("fallo de refresh conserva datos", () =>
    expect(readState([read({ data: [], isError: true })])).toBe("stale"));
  test("un fallo parcial no es cuenta vacía", () =>
    expect(readState([read({ data: [] }), read({ isError: true })])).toBe("error"));
  test("refresh normal no reemplaza contenido", () =>
    expect(readState([read({ data: [], isFetching: true })])).toBe("ready"));
});
describe("primeros pasos", () => {
  test("UC primero", () => expect(firstRunStep(0, 0, false)).toBe("subjects"));
  test("tarea después", () => expect(firstRunStep(1, 0, false)).toBe("tasks"));
  test("calendario opcional después", () => expect(firstRunStep(1, 1, false)).toBe("calendar"));
  test("configurado", () => expect(firstRunStep(1, 1, true)).toBe("ready"));
});
