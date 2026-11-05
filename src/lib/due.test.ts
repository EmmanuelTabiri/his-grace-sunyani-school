import { describe, expect, it } from "vitest";
import { dueStatus } from "./due";

describe("homework due soon", () => {
  const today = "2026-11-05";
  it("flags today through 3 days ahead as due soon", () => {
    expect(dueStatus("2026-11-05", today)).toEqual({ label: "Due today", tone: "soon" });
    expect(dueStatus("2026-11-06", today).label).toBe("Due tomorrow");
    expect(dueStatus("2026-11-08", today).tone).toBe("soon");
  });
  it("treats 4+ days as later and past dates as overdue", () => {
    expect(dueStatus("2026-11-09", today).tone).toBe("later");
    expect(dueStatus("2026-11-04", today).tone).toBe("overdue");
  });
});
