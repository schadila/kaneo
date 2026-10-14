import { describe, expect, it } from "vite-plus/test";
import { emptyDraft, fromDrafts, moveDraft, toDrafts } from "./template-draft";

describe("template drafts", () => {
  it("round-trips items through the form state", () => {
    const items = [
      {
        title: "Mastering",
        description: "Final master",
        priority: "high" as const,
        dueOffsetDays: 7,
        labels: ["Audio"],
      },
      {
        title: "Upload",
        priority: "no-priority" as const,
        dueOffsetDays: null,
        labels: [],
      },
    ];
    expect(fromDrafts(toDrafts(items))).toEqual(items);
  });

  it("drops untitled rows and treats a blank offset as no due date", () => {
    const blank = emptyDraft();
    const filled = { ...emptyDraft(), title: " Artwork ", dueOffset: "" };
    expect(fromDrafts([blank, filled])).toEqual([
      {
        title: "Artwork",
        priority: "no-priority",
        dueOffsetDays: null,
        labels: [],
      },
    ]);
  });

  it("moves rows up and down within bounds", () => {
    const [a, b] = [emptyDraft(), emptyDraft()];
    expect(moveDraft([a, b], 1, -1)).toEqual([b, a]);
    expect(moveDraft([a, b], 0, -1)).toEqual([a, b]);
  });
});
