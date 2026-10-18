import { describe, expect, it } from "vitest";
import { cedi } from "./money";

describe("cedi", () => {
  it("formats amounts in Ghana Cedi with two decimals", () => {
    expect(cedi(1250)).toBe("GH₵ 1,250.00");
  });
});
