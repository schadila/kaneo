import { describe, expect, it } from "vite-plus/test";
import { addDays, localNoon, todayInput } from "./local-noon";

describe("local date helpers", () => {
  it("turns a date input into local noon", () => {
    const date = localNoon("2026-03-28");
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([
      2026, 2, 28,
    ]);
    expect(date.getHours()).toBe(12);
  });

  it("stays on the right calendar day across a DST change", () => {
    // Europe switches to summer time on 2026-03-29.
    const due = addDays(localNoon("2026-03-28"), 2);
    expect(due.getDate()).toBe(30);
  });

  it("formats today for a date input", () => {
    expect(todayInput(new Date(2026, 9, 4, 23, 59))).toBe("2026-10-04");
  });
});
