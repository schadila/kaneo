import { useQuery } from "@tanstack/react-query";
import listTaskTemplates from "@/fetchers/task-template/list-task-templates";

export const taskTemplatesKey = (workspaceId: string) =>
  ["task-templates", workspaceId] as const;

function useGetTaskTemplates(workspaceId: string) {
  return useQuery({
    enabled: Boolean(workspaceId),
    queryKey: taskTemplatesKey(workspaceId),
    queryFn: () => listTaskTemplates(workspaceId),
  });
}

export default useGetTaskTemplates;
