import type { TaskTemplateItem } from "./template-types";

// Editable form state of one template task. dueOffset is the raw input text
// ("" = no due date) so the field can be cleared while typing. A subtask
// belongs to the nearest main task above it, so reordering keeps the tree
// consistent without tracking parent ids.
export type ItemDraft = {
  key: string;
  title: string;
  description: string;
  priority: TaskTemplateItem["priority"];
  dueOffset: string;
  labels: string[];
  isSubtask: boolean;
};

let nextKey = 0;
const newKey = () => `item-${++nextKey}`;

export function emptyDraft(isSubtask = false): ItemDraft {
  return {
    key: newKey(),
    title: "",
    description: "",
    priority: "no-priority",
    dueOffset: "",
    labels: [],
    isSubtask,
  };
}

export function toDrafts(items: TaskTemplateItem[]): ItemDraft[] {
  return items.map((item) => ({
    key: newKey(),
    title: item.title,
    description: item.description ?? "",
    priority: item.priority,
    dueOffset: item.dueOffsetDays === null ? "" : String(item.dueOffsetDays),
    labels: [...item.labels],
    isSubtask: item.parentIndex != null,
  }));
}

// Rows without a title are dropped; invalid offsets count as "no due date".
// A subtask points at the nearest main task above it; one without a main
// task above becomes a main task itself.
export function fromDrafts(drafts: ItemDraft[]): TaskTemplateItem[] {
  let lastMainIndex: number | null = null;
  return drafts
    .filter((draft) => draft.title.trim())
    .map((draft, index) => {
      const offset = Number.parseInt(draft.dueOffset, 10);
      const parentIndex = draft.isSubtask ? lastMainIndex : null;
      if (parentIndex === null) lastMainIndex = index;
      return {
        title: draft.title.trim(),
        ...(draft.description.trim()
          ? { description: draft.description.trim() }
          : {}),
        priority: draft.priority,
        dueOffsetDays: Number.isFinite(offset) ? offset : null,
        labels: draft.labels,
        parentIndex,
      };
    });
}

export function moveDraft(drafts: ItemDraft[], index: number, delta: -1 | 1) {
  const target = index + delta;
  if (target < 0 || target >= drafts.length) return drafts;
  const next = [...drafts];
  [next[index], next[target]] = [
    next[target] as ItemDraft,
    next[index] as ItemDraft,
  ];
  return next;
}

// Rows that are subtasks in the saved template (the first row never is).
export function effectiveSubtask(drafts: ItemDraft[], index: number) {
  return index > 0 && Boolean(drafts[index]?.isSubtask);
}
