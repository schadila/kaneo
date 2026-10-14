import type listTaskTemplates from "@/fetchers/task-template/list-task-templates";

export type TaskTemplate = Awaited<
  ReturnType<typeof listTaskTemplates>
>[number];

export type TaskTemplateItem = TaskTemplate["items"][number];

export const TEMPLATE_PRIORITIES = [
  "no-priority",
  "low",
  "medium",
  "high",
  "urgent",
] as const satisfies readonly TaskTemplateItem["priority"][];
