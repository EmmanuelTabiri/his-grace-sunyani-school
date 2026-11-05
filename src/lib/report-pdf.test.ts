import { describe, expect, it } from "vitest";
import { reportFilename } from "./report-pdf";
describe("pdf report naming", () => {
  it("names the file after the report and its generation date", () => {
    expect(reportFilename("Unpaid Fees Report", new Date("2026-11-05T10:00:00Z"))).toBe("unpaid-fees-report-2026-11-05.pdf");
  });
});
