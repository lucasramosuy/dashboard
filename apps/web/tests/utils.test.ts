import { describe, test, expect } from "bun:test";
import { cn, formatDate } from "../src/lib/utils";

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
      // This will use local timezone, so output depends on the timezone.
      // We will match regex instead of hardcoding text to prevent flakiness.
      // Output format for es-UY is like "12 mar. 2024" (dd mmm yyyy).
      const formatted = formatDate(input);
      expect(formatted).toMatch(/\d{2} [a-z]{3}\.? \d{4}/i);
    });
  });
});
