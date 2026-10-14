import { useMutation, useQueryClient } from "@tanstack/react-query";
import updatePage from "@/fetchers/page/update-page";
import { pageQueryKeys } from "@/hooks/queries/page/page-query-keys";

// Content saves arrive every few hundred ms while typing, so the cache is
// patched in place instead of refetching (a refetch would race the editor).
function useUpdatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePage,
    onSuccess: (page, variables) => {
      queryClient.setQueryData(pageQueryKeys.detail(page.id), page);
      if (variables.title === undefined && variables.icon === undefined) return;
      queryClient.setQueryData<(typeof page)[]>(
        pageQueryKeys.list(page.workspaceId, page.projectId ?? undefined),
        (pages) =>
          pages?.map((entry) =>
            entry.id === page.id
              ? { ...entry, title: page.title, icon: page.icon }
              : entry,
          ),
      );
    },
  });
}

export default useUpdatePage;
