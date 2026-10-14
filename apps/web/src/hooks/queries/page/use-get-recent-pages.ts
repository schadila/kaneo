import { useQuery } from "@tanstack/react-query";
import listRecentPages from "@/fetchers/page/list-recent-pages";
import { pageQueryKeys } from "./page-query-keys";

function useGetRecentPages() {
  return useQuery({
    queryKey: [...pageQueryKeys.all, "recent"],
    queryFn: listRecentPages,
  });
}

export default useGetRecentPages;
