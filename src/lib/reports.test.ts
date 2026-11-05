import { describe, expect, it } from "vitest";
import { toCsv } from "./reports";

describe("report export", () => {
  it("quotes values containing commas and quotes so columns stay aligned", () => {
    const csv = toCsv(["Student", "Amount"], [['Ama "Junior", Mensah', 150]]);
    expect(csv.split("\r\n")[1]).toBe('"Ama ""Junior"", Mensah",150');
  });
  it("leaves blanks for missing values", () => {
    expect(toCsv(["a", "b"], [[null, undefined]]).split("\r\n")[1]).toBe(",");
  });
});
