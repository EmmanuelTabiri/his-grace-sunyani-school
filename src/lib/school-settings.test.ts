import { describe, expect, it } from "vitest";
import { defaultSchoolSettings, isValidAcademicYear, SCHOOL_TERMS } from "./school-settings";

describe("school settings", () => {
  it("keeps the confirmed school identity as the default", () => {
    const settings = defaultSchoolSettings();
    expect(settings.school_name).toBe("His Grace Academy");
    expect(settings.location).toBe("Penkwase, Sunyani, Ghana");
    expect(settings.contact_email).toBeNull();
    expect(settings.contact_phone).toBeNull();
  });

  it("offers the three terms from the portal reference", () => {
    expect(SCHOOL_TERMS).toEqual(["Term 1", "Term 2", "Term 3"]);
  });

  it("accepts consecutive academic years in YYYY/YYYY format", () => {
    expect(isValidAcademicYear("2026/2027")).toBe(true);
    expect(isValidAcademicYear(" 2026/2027 ")).toBe(true);
  });

  it("rejects malformed or non-consecutive academic years", () => {
    expect(isValidAcademicYear("2026-2027")).toBe(false);
    expect(isValidAcademicYear("2026/2028")).toBe(false);
    expect(isValidAcademicYear("26/27")).toBe(false);
  });
});
