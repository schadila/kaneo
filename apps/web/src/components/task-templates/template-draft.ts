import type { TaskTemplateItem } from "./template-types";

// Editable form state of one template task. dueOffset is the raw input text
// ("" = no due date) so the field can be cleared while typing.
export type ItemDraft = {
  key: string;
  title: string;
  description: string;
  priority: TaskTemplateItem["priority"];
  dueOffset: string;
  labels: string[];
};

let nextKey = 0;
const newKey = () => `item-${++nextKey}`;

export function emptyDraft(): ItemDraft {
  return {
    key: newKey(),
    title: "",
    description: "",
    priority: "no-priority",
    dueOffset: "",
    labels: [],
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
  }));
}

// Rows without a title are dropped; invalid offsets count as "no due date".
export function fromDrafts(drafts: ItemDraft[]): TaskTemplateItem[] {
  return drafts
    .filter((draft) => draft.title.trim())
    .map((draft) => {
      const offset = Number.parseInt(draft.dueOffset, 10);
      return {
        title: draft.title.trim(),
        ...(draft.description.trim()
          ? { description: draft.description.trim() }
          : {}),
        priority: draft.priority,
        dueOffsetDays: Number.isFinite(offset) ? offset : null,
        labels: draft.labels,
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
