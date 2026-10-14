import { z } from "../openapi";
import { VALID_PRIORITIES } from "../task/validate-task-fields";

export const templateParam = z.object({ id: z.string() });

export const workspaceIdParam = z.object({ workspaceId: z.string() });

export const templateItemSchema = z
  .object({
    title: z.string().trim().min(1).max(500),
    description: z.string().max(20_000).optional(),
    priority: z.enum(VALID_PRIORITIES).default("no-priority"),
    dueOffsetDays: z
      .number()
      .int()
      .min(-365)
      .max(3650)
      .nullable()
      .default(null),
    labels: z.array(z.string().max(100)).max(20).default([]),
  })
  .openapi("TaskTemplateItem");

const templateFields = {
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000).default(""),
  items: z.array(templateItemSchema).max(100),
};

export const createTemplateBody = z.object({
  workspaceId: z.string(),
  ...templateFields,
});

export const updateTemplateBody = z.object(templateFields);

export const applyTemplateBody = z.object({
  projectId: z.string(),
  // Column slug; defaults to the project's first column.
  status: z.string().optional(),
  // ISO timestamp the due-date offsets count from (the client sends local
  // noon so whole-day offsets never cross midnight on DST changes).
  startDate: z.string().datetime({ offset: true }).optional(),
  assigneeId: z.string().nullable().optional(),
});
