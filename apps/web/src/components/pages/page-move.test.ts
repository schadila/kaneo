import { describe, expect, it } from "vite-plus/test";
import { applyMove, resolveDrop, resolveStep } from "./page-move";

const page = (id: string, parentId: string | null, position: number) => ({
  id,
  parentId,
  position,
});

// a, b (b1, b2), c
const pages = [
  page("a", null, 0),
  page("b", null, 1),
  page("b1", "b", 0),
  page("b2", "b", 1),
  page("c", null, 2),
];

describe("resolveDrop", () => {
  it("places a page before or after a sibling", () => {
    expect(resolveDrop(pages, "c", "a", "before")).toEqual({
      parentId: null,
      index: 0,
    });
    expect(resolveDrop(pages, "a", "b", "after")).toEqual({
      parentId: null,
      index: 1,
    });
  });

  it("nests a page as the last child when dropped inside", () => {
    expect(resolveDrop(pages, "a", "b", "inside")).toEqual({
      parentId: "b",
      index: 2,
    });
  });

  it("moves a subpage out to another level", () => {
    expect(resolveDrop(pages, "b1", "c", "after")).toEqual({
      parentId: null,
      index: 3,
    });
    expect(resolveDrop(pages, "b1", null, "after")).toEqual({
      parentId: null,
      index: 3,
    });
  });

  it("refuses drops onto itself or into its own subtree", () => {
    expect(resolveDrop(pages, "b", "b", "inside")).toBeNull();
    expect(resolveDrop(pages, "b", "b1", "inside")).toBeNull();
    expect(resolveDrop(pages, "b", "b2", "after")).toBeNull();
  });

  it("ignores drops that keep the page where it is", () => {
    expect(resolveDrop(pages, "b", "a", "after")).toBeNull();
    expect(resolveDrop(pages, "b", "c", "before")).toBeNull();
    expect(resolveDrop(pages, "c", null, "after")).toBeNull();
  });
});

describe("resolveStep", () => {
  it("moves one position up or down among siblings", () => {
    expect(resolveStep(pages, "b", -1)).toEqual({ parentId: null, index: 0 });
    expect(resolveStep(pages, "b", 1)).toEqual({ parentId: null, index: 2 });
    expect(resolveStep(pages, "a", -1)).toBeNull();
    expect(resolveStep(pages, "c", 1)).toBeNull();
  });
});

describe("applyMove", () => {
  it("renumbers the new and the old siblings", () => {
    const moved = applyMove(pages, "b1", { parentId: null, index: 0 });
    const byId = Object.fromEntries(moved.map((p) => [p.id, p]));
    expect(byId.b1).toMatchObject({ parentId: null, position: 0 });
    expect(byId.a?.position).toBe(1);
    expect(byId.b?.position).toBe(2);
    expect(byId.c?.position).toBe(3);
    expect(byId.b2?.position).toBe(0);
  });
});
