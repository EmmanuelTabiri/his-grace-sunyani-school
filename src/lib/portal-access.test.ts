import { describe, expect, it } from "vitest";
import { canChangeRole } from "./portal-access";

describe("head teacher hierarchy", () => {
  it("allows head teachers to assign and remove teacher access", () => {
    expect(canChangeRole(["head_teacher"], [], "teacher", false)).toBe(true);
    expect(canChangeRole(["head_teacher"], ["teacher"], "teacher", false)).toBe(true);
  });
  it("reserves administrator and head teacher access for admins", () => {
    expect(canChangeRole(["head_teacher"], [], "admin", false)).toBe(false);
    expect(canChangeRole(["head_teacher"], [], "head_teacher", false)).toBe(false);
    expect(canChangeRole(["admin"], [], "head_teacher", false)).toBe(true);
  });
  it("prevents head teachers from changing leadership accounts or themselves", () => {
    expect(canChangeRole(["head_teacher"], ["admin"], "teacher", false)).toBe(false);
    expect(canChangeRole(["head_teacher"], ["head_teacher"], "teacher", false)).toBe(false);
    expect(canChangeRole(["head_teacher"], [], "teacher", true)).toBe(false);
  });
});