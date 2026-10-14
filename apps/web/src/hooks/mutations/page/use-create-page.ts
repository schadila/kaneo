import { useMutation, useQueryClient } from "@tanstack/react-query";
import createPage from "@/fetchers/page/create-page";
import { pageQueryKeys } from "@/hooks/queries/page/page-query-keys";

function useCreatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPage,
    onSuccess: (page) => {
      queryClient.setQueryData(pageQueryKeys.detail(page.id), page);
      void queryClient.invalidateQueries({ queryKey: pageQueryKeys.all });
    },
  });
}

export default useCreatePage;
