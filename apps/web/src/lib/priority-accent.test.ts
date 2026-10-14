import { describe, expect, it } from "vite-plus/test";
import { priorityAccentClass } from "./priority-accent";

describe("priorityAccentClass", () => {
  it("colors urgent, high, medium and low priorities", () => {
    expect(priorityAccentClass("urgent")).toContain("before:bg-destructive");
    expect(priorityAccentClass("high")).toContain("before:bg-warning");
    expect(priorityAccentClass("low")).toContain("before:bg-info/50");
  });

  it("adds no bar without a priority", () => {
    expect(priorityAccentClass("no-priority")).toBe("");
    expect(priorityAccentClass(null)).toBe("");
  });
});
