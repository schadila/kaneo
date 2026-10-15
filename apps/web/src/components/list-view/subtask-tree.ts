type TreeTask = {
  id: string;
  subtaskCounts?: { completed: number; total: number } | null;
};

export type SubtaskTree<T extends TreeTask> = {
  childrenOf: Map<string, T[]>;
  // Subtasks shown under their parent instead of as a row of their own.
  nested: Set<string>;
};

// Groups the visible tasks into parent → subtasks. A subtask is only nested
// when its parent is visible too (e.g. not filtered out); otherwise it stays a
// normal row so nothing disappears. Child order follows the given task order.
export function buildSubtaskTree<T extends TreeTask>(
  tasks: T[],
  pairs: ReadonlyArray<{ parentId: string; childId: string }>,
): SubtaskTree<T> {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const parentOf = new Map<string, string>();
  for (const { parentId, childId } of pairs) {
    if (parentId === childId) continue;
    if (byId.has(parentId) && byId.has(childId))
      parentOf.set(childId, parentId);
  }

  const childrenOf = new Map<string, T[]>();
  const nested = new Set<string>();
  for (const task of tasks) {
    const parentId = parentOf.get(task.id);
    // Only one level: a task that is itself nested cannot host children here.
    if (!parentId || parentOf.has(parentId)) continue;
    childrenOf.set(parentId, [...(childrenOf.get(parentId) ?? []), task]);
    nested.add(task.id);
  }
  return { childrenOf, nested };
}

// Cheap fingerprint of all subtask counts; changes when subtasks change.
export function subtaskRevision(tasks: TreeTask[]) {
  return tasks
    .filter((task) => task.subtaskCounts?.total)
    .map((task) => `${task.id}:${task.subtaskCounts?.total}`)
    .join(",");
}
