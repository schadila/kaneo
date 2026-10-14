import { useQuery } from "@tanstack/react-query";
import listPages from "@/fetchers/page/list-pages";
import { pageQueryKeys } from "./page-query-keys";

function useGetPages(workspaceId: string, projectId?: string) {
  return useQuery({
    enabled: Boolean(workspaceId),
    queryKey: pageQueryKeys.list(workspaceId, projectId),
    queryFn: () => listPages({ workspaceId, projectId }),
  });
}

export default useGetPages;
