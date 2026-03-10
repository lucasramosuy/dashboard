import { describe, it, expect } from "bun:test";
import { subjectsService } from "../src/services/subjectsService";

describe("subjectsService", () => {
  describe("getSuggestedDuration", () => {
    it("should return the correct duration for 'semestral' track", () => {
      const result = subjectsService.getSuggestedDuration("semestral");
      expect(result).toEqual({ weeks: 15, suggestedClasses: 15 });
    });

    it("should return the correct duration for 'anual' track", () => {
      const result = subjectsService.getSuggestedDuration("anual");
      expect(result).toEqual({ weeks: 30, suggestedClasses: 30 });
    });
  });

  describe("getAllTracks", () => {
    it("should return all track options with their suggested values", () => {
      const result = subjectsService.getAllTracks();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result).toEqual([
        { track: "semestral", weeks: 15, suggestedClasses: 15 },
        { track: "anual", weeks: 30, suggestedClasses: 30 },
      ]);
    });
  });

  describe("calculateAttendancePercentage", () => {
    it("should return 100 if totalClasses is 0", () => {
      expect(subjectsService.calculateAttendancePercentage(0, 5)).toBe(100);
    });

    it("should return 100 if totalClasses is negative", () => {
      expect(subjectsService.calculateAttendancePercentage(-5, 5)).toBe(100);
    });

    it("should calculate correct percentage with no absences", () => {
      expect(subjectsService.calculateAttendancePercentage(10, 0)).toBe(100);
    });

    it("should calculate correct percentage with some absences", () => {
      expect(subjectsService.calculateAttendancePercentage(10, 2)).toBe(80);
    });

    it("should calculate correct percentage with half absences", () => {
      expect(subjectsService.calculateAttendancePercentage(10, 5)).toBe(50);
    });

    it("should round the percentage to nearest integer", () => {
      // 30 classes, 7 absences = 23 / 30 = 76.666...% -> 77
      expect(subjectsService.calculateAttendancePercentage(30, 7)).toBe(77);

      // 30 classes, 8 absences = 22 / 30 = 73.333...% -> 73
      expect(subjectsService.calculateAttendancePercentage(30, 8)).toBe(73);
    });

    it("should return 0 if absences exceed totalClasses", () => {
      expect(subjectsService.calculateAttendancePercentage(10, 15)).toBe(0);
    });
  });

  describe("isAtRisk", () => {
    it("should return true if attendance is below 75%", () => {
      // 10 classes, 3 absences -> 70%
      expect(subjectsService.isAtRisk(10, 3)).toBe(true);
    });

    it("should return false if attendance is exactly 75%", () => {
      // 20 classes, 5 absences -> 15/20 -> 75%
      expect(subjectsService.isAtRisk(20, 5)).toBe(false);
    });

    it("should return false if attendance is above 75%", () => {
      // 20 classes, 4 absences -> 16/20 -> 80%
      expect(subjectsService.isAtRisk(20, 4)).toBe(false);
    });

    it("should return false if totalClasses is 0 (since attendance is 100%)", () => {
      expect(subjectsService.isAtRisk(0, 0)).toBe(false);
    });
  });
});
