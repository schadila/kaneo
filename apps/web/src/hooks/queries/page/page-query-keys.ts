export const pageQueryKeys = {
  all: ["pages"] as const,
  list: (workspaceId: string, projectId?: string) =>
    ["pages", workspaceId, projectId ?? null] as const,
  detail: (id: string) => ["page", id] as const,
};
