import { useMutation, useQueryClient } from "@tanstack/react-query";
import deletePage from "@/fetchers/page/delete-page";
import { pageQueryKeys } from "@/hooks/queries/page/page-query-keys";

function useDeletePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePage,
    onSuccess: (page) => {
      queryClient.removeQueries({ queryKey: pageQueryKeys.detail(page.id) });
      void queryClient.invalidateQueries({ queryKey: pageQueryKeys.all });
    },
  });
}

export default useDeletePage;
