import { describe, expect, it } from "vitest";
import { feeCollectionByMonth, greetingFor, learningStageCount } from "./portal-overview";

describe("portal overview summaries", () => {
  it("uses the payment month for collected fees and creation month for unpaid fees", () => {
    const rows = feeCollectionByMonth([
      { amount: 850, status: "paid", paid_on: "2026-11-05T10:00:00Z", created_at: "2026-09-01T10:00:00Z" },
      { amount: "200", status: "unpaid", paid_on: null, created_at: "2026-11-03T10:00:00Z" },
      { amount: 999, status: "paid", paid_on: "2026-04-01T10:00:00Z", created_at: "2026-04-01T10:00:00Z" },
    ], new Date("2026-11-14T12:00:00Z"));
    expect(rows).toHaveLength(6);
    expect(rows.at(-1)).toMatchObject({ key: "2026-11", collected: 850, outstanding: 200 });
    expect(rows[0]?.key).toBe("2026-06");
  });

  it("recognises the school's four learning stages", () => {
    expect(learningStageCount(["Creche 1", "KG 2", "Basic 6", "JHS 3"])).toBe(4);
  });

  it("greets people according to the local time of day", () => {
    expect(greetingFor(new Date("2026-11-14T08:00:00"))).toBe("Good morning");
    expect(greetingFor(new Date("2026-11-14T18:00:00"))).toBe("Good evening");
  });
});
