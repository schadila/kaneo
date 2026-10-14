import { z } from "../openapi";

export const pageParam = z.object({ id: z.string() });

export const workspaceIdParam = z.object({ workspaceId: z.string() });

export const listPagesQuery = z.object({
  projectId: z.string().optional().openapi({
    description: "Project docs to list; omit for the workspace wiki",
  }),
});

export const createPageBody = z.object({
  workspaceId: z.string(),
  projectId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  title: z.string().max(500).optional(),
});

export const updatePageBody = z.object({
  title: z.string().max(500).optional(),
  icon: z.string().max(32).nullable().optional(),
  content: z.string().max(1_000_000).optional(),
});

export const movePageBody = z.object({
  parentId: z.string().nullable(),
  index: z.number().int().min(0),
});
