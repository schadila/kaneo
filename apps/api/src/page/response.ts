import { responseTimestamp, z } from "../openapi";

export const pageSummarySchema = z
  .object({
    id: z.string(),
    workspaceId: z.string(),
    projectId: z.string().nullable(),
    parentId: z.string().nullable(),
    title: z.string(),
    icon: z.string().nullable(),
    position: z.number(),
    updatedAt: responseTimestamp,
  })
  .openapi("PageSummary");

export const pageListSchema = z.array(pageSummarySchema);

export const recentPageListSchema = z.array(
  pageSummarySchema
    .extend({ workspaceName: z.string(), projectName: z.string().nullable() })
    .openapi("RecentPage"),
);

export const pageSchema = pageSummarySchema
  .extend({
    content: z.string(),
    createdBy: z.string().nullable(),
    updatedBy: z.string().nullable(),
    createdAt: responseTimestamp,
  })
  .openapi("Page");
