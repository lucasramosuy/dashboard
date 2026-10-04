import { expect, test } from "bun:test";
import { containDialogFocus } from "../src/components/ui/dialog-focus";

test("Tab al final vuelve al primer control; Shift+Tab vuelve al último", () => {
  const saved = globalThis.document;
  let active: object;
  const first = {
    getClientRects: () => [1],
    closest: () => null,
    focus: () => {
      active = first;
    },
  };
  const last = {
    getClientRects: () => [1],
    closest: () => null,
    focus: () => {
      active = last;
    },
  };
  const dialog = {
    querySelectorAll: () => [first, last],
    contains: (el: object) => el === first || el === last,
  };
  globalThis.document = {
    get activeElement() {
      return active;
    },
  } as unknown as Document;
  try {
    let prevented = 0;
    active = last;
    containDialogFocus({
      key: "Tab",
      shiftKey: false,
      currentTarget: dialog,
      preventDefault: () => prevented++,
    } as never);
    expect(active).toBe(first);
    containDialogFocus({
      key: "Tab",
      shiftKey: true,
      currentTarget: dialog,
      preventDefault: () => prevented++,
    } as never);
    expect(active).toBe(last);
    expect(prevented).toBe(2);
  } finally {
    globalThis.document = saved;
  }
});
