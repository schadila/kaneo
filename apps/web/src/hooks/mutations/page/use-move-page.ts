import { useMutation, useQueryClient } from "@tanstack/react-query";
import { applyMove } from "@/components/pages/page-move";
import type { PageListItem } from "@/components/pages/page-types";
import movePage from "@/fetchers/page/move-page";
import { pageQueryKeys } from "@/hooks/queries/page/page-query-keys";

// The tree reorders immediately; a failed move restores the previous order.
function useMovePage(workspaceId: string, projectId?: string) {
  const queryClient = useQueryClient();
  const listKey = pageQueryKeys.list(workspaceId, projectId);

  return useMutation({
    mutationFn: movePage,
    onMutate: async ({ id, parentId, index }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<PageListItem[]>(listKey);
      if (previous)
        queryClient.setQueryData(
          listKey,
          applyMove(previous, id, { parentId, index }),
        );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous)
        queryClient.setQueryData(listKey, context.previous);
    },
    onSuccess: (page) => {
      queryClient.setQueryData(pageQueryKeys.detail(page.id), page);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: listKey });
    },
  });
}

export default useMovePage;
