import { responseTimestamp, z } from "../openapi";
import { templateItemSchema } from "./schema";

export const templateSchema = z
  .object({
    id: z.string(),
    workspaceId: z.string(),
    name: z.string(),
    description: z.string(),
    items: z.array(templateItemSchema),
    createdBy: z.string().nullable(),
    updatedBy: z.string().nullable(),
    createdAt: responseTimestamp,
    updatedAt: responseTimestamp,
  })
  .openapi("TaskTemplate");

export const templateListSchema = z.array(templateSchema);

export const applyTemplateResultSchema = z
  .object({ created: z.number(), taskIds: z.array(z.string()) })
  .openapi("ApplyTaskTemplateResult");
