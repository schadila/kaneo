import { describe, expect, it } from "vite-plus/test";
import { buildPageTree, pageAncestorIds } from "./build-page-tree";

const page = (id: string, parentId: string | null, position: number) => ({
  id,
  parentId,
  position,
});

describe("buildPageTree", () => {
  it("nests children under their parent, ordered by position", () => {
    const tree = buildPageTree([
      page("b", null, 1),
      page("a", null, 0),
      page("a2", "a", 1),
      page("a1", "a", 0),
    ]);
    expect(tree.map((node) => node.id)).toEqual(["a", "b"]);
    expect(tree[0]?.children.map((node) => node.id)).toEqual(["a1", "a2"]);
  });

  it("keeps pages whose parent is missing at the root", () => {
    const tree = buildPageTree([page("x", "gone", 0)]);
    expect(tree.map((node) => node.id)).toEqual(["x"]);
  });
});

describe("pageAncestorIds", () => {
  it("returns the path from the root down to the parent", () => {
    const pages = [page("a", null, 0), page("b", "a", 0), page("c", "b", 0)];
    expect(pageAncestorIds(pages, "c")).toEqual(["a", "b"]);
    expect(pageAncestorIds(pages, "a")).toEqual([]);
    expect(pageAncestorIds(pages, undefined)).toEqual([]);
  });

  it("stops on a cycle instead of looping", () => {
    const pages = [page("a", "b", 0), page("b", "a", 0)];
    expect(pageAncestorIds(pages, "a")).toEqual(["a", "b"]);
  });
});
