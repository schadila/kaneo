type TreeInput = {
  id: string;
  parentId: string | null;
  position: number;
};

export type PageNode<T extends TreeInput> = T & { children: PageNode<T>[] };

// Pages arrive flat; orphans (parent not visible) are shown at the root so
// nothing silently disappears.
export function buildPageTree<T extends TreeInput>(pages: T[]): PageNode<T>[] {
  const nodes = new Map<string, PageNode<T>>();
  for (const page of pages) nodes.set(page.id, { ...page, children: [] });

  const roots: PageNode<T>[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    (parent ? parent.children : roots).push(node);
  }

  const sort = (list: PageNode<T>[]) => {
    list.sort((a, b) => a.position - b.position);
    for (const node of list) sort(node.children);
  };
  sort(roots);
  return roots;
}

export function pageAncestorIds<T extends TreeInput>(
  pages: T[],
  id: string | undefined,
): string[] {
  const byId = new Map(pages.map((page) => [page.id, page]));
  const ancestors: string[] = [];
  let current = id ? byId.get(id) : undefined;
  while (current?.parentId && !ancestors.includes(current.parentId)) {
    ancestors.unshift(current.parentId);
    current = byId.get(current.parentId);
  }
  return ancestors;
}
