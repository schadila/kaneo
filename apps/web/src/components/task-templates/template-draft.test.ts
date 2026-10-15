import { describe, expect, it } from "vite-plus/test";
import { emptyDraft, fromDrafts, moveDraft, toDrafts } from "./template-draft";

const item = (title: string, parentIndex: number | null = null) => ({
  title,
  priority: "no-priority" as const,
  dueOffsetDays: null,
  labels: [],
  parentIndex,
});

describe("template drafts", () => {
  it("round-trips items, including subtasks, through the form state", () => {
    const items = [
      {
        title: "Mastering",
        description: "Final master",
        priority: "high" as const,
        dueOffsetDays: 7,
        labels: ["Audio"],
        parentIndex: null,
      },
      item("Stems exportieren", 0),
      item("Upload"),
    ];
    expect(fromDrafts(toDrafts(items))).toEqual(items);
  });

  it("drops untitled rows and treats a blank offset as no due date", () => {
    const blank = emptyDraft();
    const filled = { ...emptyDraft(), title: " Artwork ", dueOffset: "" };
    expect(fromDrafts([blank, filled])).toEqual([item("Artwork")]);
  });

  it("attaches subtasks to the nearest main task above, after reordering too", () => {
    const drafts = toDrafts([
      item("Planung"),
      item("Budget", 0),
      item("Technik"),
      item("Mikrofone", 2),
    ]);
    // Move "Mikrofone" above "Technik": it now belongs to "Planung".
    expect(
      fromDrafts(moveDraft(drafts, 3, -1)).map((entry) => entry.parentIndex),
    ).toEqual([null, 0, 0, null]);
  });

  it("turns a subtask without a main task above into a main task", () => {
    const orphan = { ...emptyDraft(true), title: "Allein" };
    expect(fromDrafts([orphan])[0]?.parentIndex).toBeNull();
  });

  it("moves rows up and down within bounds", () => {
    const [a, b] = [emptyDraft(), emptyDraft()];
    expect(moveDraft([a, b], 1, -1)).toEqual([b, a]);
    expect(moveDraft([a, b], 0, -1)).toEqual([a, b]);
  });
});
