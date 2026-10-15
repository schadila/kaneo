import { describe, expect, it } from "vite-plus/test";
import { buildSubtaskTree, subtaskRevision } from "./subtask-tree";

const task = (id: string, total = 0) => ({
  id,
  subtaskCounts: { completed: 0, total },
});

describe("buildSubtaskTree", () => {
  it("nests subtasks under a visible parent, in task order", () => {
    const tasks = [task("p", 2), task("c2"), task("c1"), task("x")];
    const tree = buildSubtaskTree(tasks, [
      { parentId: "p", childId: "c1" },
      { parentId: "p", childId: "c2" },
    ]);
    expect(tree.childrenOf.get("p")?.map((t) => t.id)).toEqual(["c2", "c1"]);
    expect([...tree.nested]).toEqual(["c2", "c1"]);
  });

  it("keeps a subtask as its own row when the parent is not visible", () => {
    const tree = buildSubtaskTree(
      [task("c1")],
      [{ parentId: "hidden", childId: "c1" }],
    );
    expect(tree.nested.size).toBe(0);
    expect(tree.childrenOf.size).toBe(0);
  });

  it("nests only one level deep", () => {
    const tree = buildSubtaskTree(
      [task("a"), task("b"), task("c")],
      [
        { parentId: "a", childId: "b" },
        { parentId: "b", childId: "c" },
      ],
    );
    expect(tree.childrenOf.get("a")?.map((t) => t.id)).toEqual(["b"]);
    expect(tree.childrenOf.has("b")).toBe(false);
    expect(tree.nested.has("c")).toBe(false);
  });
});

describe("subtaskRevision", () => {
  it("changes when a subtask count changes", () => {
    expect(subtaskRevision([task("a", 1)])).not.toBe(
      subtaskRevision([task("a", 2)]),
    );
    expect(subtaskRevision([task("a")])).toBe("");
  });
});
