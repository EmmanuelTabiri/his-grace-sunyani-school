import { describe, expect, it } from "vitest";
import { portalSections, schoolYear } from "./portal-nav";

const ids = (r: Parameters<typeof portalSections>[0]) => portalSections(r).map((s) => s.id);

describe("portal navigation by role", () => {
  it("only admins see fees and reports", () => {
    expect(ids(["admin"])).toContain("fees");
    expect(ids(["head_teacher"])).not.toContain("fees");
    expect(ids(["teacher"])).not.toContain("reports");
  });
  it("families never see staff pages", () => {
    for (const r of [["student"], ["parent"]] as const) {
      expect(ids([...r])).not.toContain("students");
      expect(ids([...r])).not.toContain("gradebook");
      expect(ids([...r])).toContain("fees");
    }
  });
  it("users with no role get no pages", () => expect(ids([])).toEqual([]));
  it("school year starts in September", () => {
    expect(schoolYear(new Date("2026-11-05"))).toBe("2026/2027");
    expect(schoolYear(new Date("2027-03-01"))).toBe("2026/2027");
  });
});
