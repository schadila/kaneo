// One level of subtasks: parentIndex must point to an *earlier* item that is
// itself a main task. Returns the first problem, or null when valid.
export function templateItemsProblem(
  items: ReadonlyArray<{ parentIndex?: number | null }>,
): { index: number; message: string } | null {
  for (const [index, item] of items.entries()) {
    const parentIndex = item.parentIndex ?? null;
    if (parentIndex === null) continue;
    if (parentIndex >= index)
      return { index, message: "parentIndex must point to an earlier item" };
    if ((items[parentIndex]?.parentIndex ?? null) !== null)
      return { index, message: "Subtasks cannot have subtasks" };
  }
  return null;
}
