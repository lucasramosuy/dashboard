import { test, expect, describe, spyOn, beforeAll, afterAll } from "bun:test";
import {
  formatDate,
  formatFriendlyDate,
  formatDateLong,
  formatDateShort,
  formatRelative,
  formatCurrency,
  formatNumber,
} from "./format";

describe("format.ts utilities", () => {
  const testDateStr = "2023-10-15T12:00:00Z";
  const testDate = new Date(testDateStr);

  describe("formatDate", () => {
    test("formats a valid ISO date string correctly", () => {
      // 15/10/2023 in es-UY
      expect(formatDate("2023-10-15T12:00:00Z")).toBe("15/10/2023");
    });

    test("formats a Date object correctly", () => {
      expect(formatDate(new Date("2023-10-15T12:00:00Z"))).toBe("15/10/2023");
    });

    test("returns empty string for null", () => {
      expect(formatDate(null)).toBe("");
    });

    test("returns empty string for undefined", () => {
      expect(formatDate(undefined)).toBe("");
    });

    test("returns empty string for invalid date string", () => {
      expect(formatDate("invalid-date")).toBe("");
    });
  });

  describe("formatFriendlyDate", () => {
    test("formats a valid ISO date string to friendly format", () => {
      // should output like "15 oct, 2023" or "15 Oct, 2023"
      const result = formatFriendlyDate("2023-10-15T12:00:00Z");
      expect(result.toLowerCase()).toMatch(/15 oct, 2023/);
    });

    test("returns empty string for null", () => {
      expect(formatFriendlyDate(null)).toBe("");
    });

    test("returns empty string for undefined", () => {
      expect(formatFriendlyDate(undefined)).toBe("");
    });

    test("returns empty string for invalid date string", () => {
      expect(formatFriendlyDate("invalid-date")).toBe("");
    });
  });

  describe("formatDateLong", () => {
    test("formats a valid ISO date string correctly", () => {
      const result = formatDateLong("2023-10-15T12:00:00Z");
      // "domingo, 15 de octubre de 2023" in es-UY locale
      expect(result).toContain("octubre");
      expect(result).toContain("2023");
    });

    test("returns empty string for null", () => {
      expect(formatDateLong(null)).toBe("");
    });

    test("returns empty string for invalid date string", () => {
      expect(formatDateLong("invalid")).toBe("");
    });
  });

  describe("formatDateShort", () => {
    test("formats a valid ISO date string correctly", () => {
      const result = formatDateShort("2023-10-15T12:00:00Z");
      // "15 oct"
      expect(result).toContain("15");
      expect(result).toContain("oct");
    });

    test("returns empty string for null", () => {
      expect(formatDateShort(null)).toBe("");
    });

    test("returns empty string for invalid date string", () => {
      expect(formatDateShort("invalid")).toBe("");
    });
  });

  describe("formatRelative", () => {
    let nowSpy: any;

    beforeAll(() => {
      nowSpy = spyOn(Date, "now").mockImplementation(() => testDate.getTime());
    });

    afterAll(() => {
      nowSpy.mockRestore();
    });

    test("formats relative minutes correctly", () => {
      const fiveMinsAgo = new Date(testDate.getTime() - 5 * 60 * 1000);
      expect(formatRelative(fiveMinsAgo)).toBe("hace 5 minutos");

      const inTenMins = new Date(testDate.getTime() + 10 * 60 * 1000);
      expect(formatRelative(inTenMins)).toBe("dentro de 10 minutos");
    });

    test("formats relative hours correctly", () => {
      const twoHoursAgo = new Date(testDate.getTime() - 2 * 3600 * 1000);
      expect(formatRelative(twoHoursAgo)).toBe("hace 2 horas");
    });

    test("formats relative days correctly", () => {
      const threeDaysAgo = new Date(testDate.getTime() - 3 * 86400 * 1000);
      expect(formatRelative(threeDaysAgo)).toBe("hace 3 días");
    });

    test("returns empty string for null", () => {
      expect(formatRelative(null)).toBe("");
    });

    test("returns empty string for invalid date string", () => {
      expect(formatRelative("invalid")).toBe("");
    });
  });

  describe("formatCurrency", () => {
    test("formats number as UYU currency", () => {
      const result = formatCurrency(1234.5);
      // Depending on Node version it might be $ 1.234 or something like UYU 1.234
      const cleaned = result.replace(/\s+/g, " ").replace(/\u00A0/g, " ");
      expect(cleaned).toContain("1.234");
    });

    test("formats zero correctly", () => {
      expect(formatCurrency(0)).toMatch(/0/);
    });
  });

  describe("formatNumber", () => {
    test("formats number with locale separators", () => {
      const result = formatNumber(1234567.89);
      expect(result).toMatch(/1\.234\.567,89/);
    });
  });
});
