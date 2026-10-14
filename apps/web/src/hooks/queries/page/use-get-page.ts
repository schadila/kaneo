import { useQuery } from "@tanstack/react-query";
import getPage from "@/fetchers/page/get-page";
import { pageQueryKeys } from "./page-query-keys";

function useGetPage(id: string | undefined) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: pageQueryKeys.detail(id ?? ""),
    queryFn: () => getPage(id ?? ""),
  });
}

export default useGetPage;
