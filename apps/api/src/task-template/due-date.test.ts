import { describe, expect, it } from "vite-plus/test";
import { templateDueDate } from "./due-date";

describe("templateDueDate", () => {
  const start = new Date("2026-10-14T10:00:00.000Z");

  it("adds whole days to the start date", () => {
    expect(templateDueDate(start, 0)?.toISOString()).toBe(
      "2026-10-14T10:00:00.000Z",
    );
    expect(templateDueDate(start, 7)?.toISOString()).toBe(
      "2026-10-21T10:00:00.000Z",
    );
    expect(templateDueDate(start, -2)?.toISOString()).toBe(
      "2026-10-12T10:00:00.000Z",
    );
  });

  it("leaves items without offset undated", () => {
    expect(templateDueDate(start, null)).toBeUndefined();
  });
});
