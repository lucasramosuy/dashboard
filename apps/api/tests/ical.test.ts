import { expect, test, describe } from "bun:test";
import { updateIcalSchema } from "@dashboard/shared-types";

describe("iCal Integration - Schemas", () => {
  test("Normalizes webcal:// to https://", () => {
    const input = { ical_url: "webcal://schoology.ort.edu.uy/foo/bar.ics" };
    const result = updateIcalSchema.parse(input);
    expect(result.ical_url).toBe("https://schoology.ort.edu.uy/foo/bar.ics");
  });

  test("Allows https:// directly", () => {
    const input = { ical_url: "https://schoology.ort.edu.uy/foo/bar.ics" };
    const result = updateIcalSchema.parse(input);
    expect(result.ical_url).toBe("https://schoology.ort.edu.uy/foo/bar.ics");
  });

  test("Allows empty string meaning removing the URL", () => {
    const input = { ical_url: "" };
    const result = updateIcalSchema.parse(input);
    expect(result.ical_url).toBe("");
  });

  test("Does not allow invalid formats like random string", () => {
    const input = { ical_url: "random-string" };
    expect(() => updateIcalSchema.parse(input)).toThrow("Debe ser una URL válida");
  });
});
