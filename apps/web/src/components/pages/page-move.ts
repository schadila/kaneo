type TreeInput = {
  id: string;
  parentId: string | null;
  position: number;
};

export type DropZone = "before" | "inside" | "after";

export type MoveTarget = { parentId: string | null; index: number };

function sortedChildren<T extends TreeInput>(
  pages: T[],
  parentId: string | null,
  excludeId: string,
) {
  return pages
    .filter((page) => page.parentId === parentId && page.id !== excludeId)
    .sort((a, b) => a.position - b.position);
}

function isInSubtree<T extends TreeInput>(
  pages: T[],
  rootId: string,
  candidateId: string,
) {
  const byId = new Map(pages.map((page) => [page.id, page]));
  const seen = new Set<string>();
  let current = byId.get(candidateId);
  while (current && !seen.has(current.id)) {
    if (current.id === rootId) return true;
    seen.add(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return false;
}

function isNoop<T extends TreeInput>(
  pages: T[],
  activeId: string,
  target: MoveTarget,
) {
  const active = pages.find((page) => page.id === activeId);
  if (!active || active.parentId !== target.parentId) return false;
  const siblings = sortedChildren(pages, target.parentId, activeId);
  const currentIndex = siblings.filter(
    (page) => page.position < active.position,
  ).length;
  return currentIndex === target.index;
}

// Where dropping `activeId` on `overId` (or on the empty area below the tree
// when overId is null) puts it. Null when the drop is not allowed (onto
// itself or into its own subtree) or would change nothing.
export function resolveDrop<T extends TreeInput>(
  pages: T[],
  activeId: string,
  overId: string | null,
  zone: DropZone,
): MoveTarget | null {
  let target: MoveTarget;
  if (overId === null) {
    target = {
      parentId: null,
      index: sortedChildren(pages, null, activeId).length,
    };
  } else {
    if (overId === activeId || isInSubtree(pages, activeId, overId))
      return null;
    const over = pages.find((page) => page.id === overId);
    if (!over) return null;
    if (zone === "inside") {
      target = {
        parentId: over.id,
        index: sortedChildren(pages, over.id, activeId).length,
      };
    } else {
      const siblings = sortedChildren(pages, over.parentId, activeId);
      const overIndex = siblings.findIndex((page) => page.id === over.id);
      target = {
        parentId: over.parentId,
        index: overIndex + (zone === "after" ? 1 : 0),
      };
    }
  }
  return isNoop(pages, activeId, target) ? null : target;
}

// One step up or down among the current siblings (menu/keyboard fallback).
export function resolveStep<T extends TreeInput>(
  pages: T[],
  id: string,
  direction: -1 | 1,
): MoveTarget | null {
  const page = pages.find((entry) => entry.id === id);
  if (!page) return null;
  const siblings = sortedChildren(pages, page.parentId, id);
  const current = siblings.filter((s) => s.position < page.position).length;
  const index = current + direction;
  if (index < 0 || index > siblings.length) return null;
  return { parentId: page.parentId, index };
}

// Mirrors the server's renumbering so the tree can update optimistically.
export function applyMove<T extends TreeInput>(
  pages: T[],
  id: string,
  target: MoveTarget,
): T[] {
  const page = pages.find((entry) => entry.id === id);
  if (!page) return pages;
  const positions = new Map<string, number>();

  const newSiblings = sortedChildren(pages, target.parentId, id);
  const ordered = [
    ...newSiblings.slice(0, target.index),
    page,
    ...newSiblings.slice(target.index),
  ];
  ordered.forEach((entry, position) => positions.set(entry.id, position));
  if (page.parentId !== target.parentId) {
    sortedChildren(pages, page.parentId, id).forEach((entry, position) =>
      positions.set(entry.id, position),
    );
  }

  return pages.map((entry) => {
    const position = positions.get(entry.id);
    if (entry.id === id)
      return { ...entry, parentId: target.parentId, position: position ?? 0 };
    return position === undefined ? entry : { ...entry, position };
  });
}
