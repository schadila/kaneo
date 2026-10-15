import type { taskTemplateTable } from "./task-template-table";

type TemplateRow = typeof taskTemplateTable.$inferSelect;

// Templates saved before subtasks existed have items without parentIndex.
export function normalizeTemplate(template: TemplateRow) {
  return {
    ...template,
    items: template.items.map((item) => ({
      ...item,
      parentIndex: item.parentIndex ?? null,
    })),
  };
}
