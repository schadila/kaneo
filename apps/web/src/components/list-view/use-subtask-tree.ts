import { useMemo } from "react";
import useGetSubtaskPairs from "@/hooks/queries/subtask-map/use-get-subtask-pairs";
import { useStoredState } from "@/hooks/use-stored-state";
import type { ProjectWithTasks } from "@/types/project";
import type Task from "@/types/task";
import { buildSubtaskTree, subtaskRevision } from "./subtask-tree";
import type { SubtaskTreeContextValue } from "./subtask-tree-context";

const parseIds = (raw: unknown): string[] =>
  Array.isArray(raw) ? raw.filter((id) => typeof id === "string") : [];

// Eden: parent/subtask nesting for the list view. Which parents are open is
// remembered per project in localStorage.
export function useSubtaskTree(
  project: ProjectWithTasks,
): SubtaskTreeContextValue {
  const tasks = useMemo(
    () => (project.columns ?? []).flatMap((column) => column.tasks) as Task[],
    [project.columns],
  );
  const revision = useMemo(() => subtaskRevision(tasks), [tasks]);
  // No task has subtasks → nothing to fetch.
  const { data: pairs = [] } = useGetSubtaskPairs(
    revision ? project.id : "",
    revision,
  );
  const tree = useMemo(() => buildSubtaskTree(tasks, pairs), [tasks, pairs]);
  const [open, setOpen] = useStoredState<string[]>(
    `eden:list-open-subtasks:${project.id}`,
    parseIds,
    [],
  );

  return useMemo(() => {
    const openSet = new Set(open);
    return {
      hasNesting: tree.childrenOf.size > 0,
      childrenOf: (taskId) => tree.childrenOf.get(taskId) ?? [],
      isNested: (taskId) => tree.nested.has(taskId),
      isOpen: (taskId) => openSet.has(taskId),
      toggle: (taskId) =>
        setOpen((current) =>
          current.includes(taskId)
            ? current.filter((id) => id !== taskId)
            : [...current, taskId],
        ),
    };
  }, [tree, open, setOpen]);
}
