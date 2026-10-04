import { describe, test, expect } from "bun:test";
import { cn } from "../src/lib/utils";
import { formatDate } from "../src/lib/format";

describe("utils", () => {
  describe("cn", () => {
    test("merges basic classes", () => {
      expect(cn("px-2 py-1", "bg-red-500")).toBe("px-2 py-1 bg-red-500");
    });

    test("merges tailwind classes overriding previous ones", () => {
      expect(cn("px-2 py-1 bg-red-500", "p-3 bg-blue-500")).toBe(
        "p-3 bg-blue-500",
      );
    });

    test("handles conditional classes", () => {
      const isRed = true;
      const isWhite = false;
      expect(cn("px-2 py-1", isRed && "bg-red-500", isWhite && "text-white")).toBe(
        "px-2 py-1 bg-red-500",
      );
    });

    test("handles arrays", () => {
      expect(cn(["px-2 py-1", "bg-red-500"])).toBe("px-2 py-1 bg-red-500");
    });

    test("handles undefined and null", () => {
      expect(cn("px-2 py-1", undefined, null, "bg-red-500")).toBe(
        "px-2 py-1 bg-red-500",
      );
    });

    test("handles complex combinations", () => {
      expect(
        cn("px-2 py-1", ["bg-red-500", { "text-white": true, "font-bold": false }]),
      ).toBe("px-2 py-1 bg-red-500 text-white");
    });
  });

  describe("formatDate", () => {
    test.each([
      { description: "from a string", input: "2024-03-12T12:00:00Z" },
      { description: "from a Date object", input: new Date("2024-03-12T12:00:00Z") },
    ])("formats date correctly $description", ({ input }) => {
      // Mediodía UTC conserva el día tanto en Uruguay como en UTC.
      // El formato canónico es numérico es-UY, no el antiguo mes abreviado.
      expect(formatDate(input)).toBe("12/03/2024");
    });
  });
});
