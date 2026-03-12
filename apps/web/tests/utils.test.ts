import { describe, test, expect } from "bun:test";
import { cn } from "../src/lib/utils";

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
});
