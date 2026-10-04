import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PlannerMoveForm } from "../src/components/planner/PlannerMoveForm";

test("alternativa de teclado/touch: fecha etiquetada y submit, sin drag", () => {
  const html = renderToStaticMarkup(
    <PlannerMoveForm date="2026-10-04" pending={false} onMove={() => {}} />,
  );
  expect(html).toContain('type="date"');
  expect(html).toContain('value="2026-10-04"');
  expect(html).toContain("Mover a otra fecha");
  expect(html).toContain('type="submit"');
  expect(html).toContain("Mover tarea");
});

test("durante guardado no admite otro movimiento", () => {
  const html = renderToStaticMarkup(
    <PlannerMoveForm date="2026-10-04" pending={true} onMove={() => {}} />,
  );
  expect((html.match(/disabled=""/g) || []).length).toBe(2);
});
