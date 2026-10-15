import { useQuery } from "@tanstack/react-query";
import getSubtaskPairs from "@/fetchers/subtask-map/get-subtask-pairs";

// `revision` changes whenever a task's subtask count changes (the board data
// is kept live), so the pairs refetch exactly when subtasks were added,
// removed or moved — without a separate realtime channel.
function useGetSubtaskPairs(projectId: string, revision: string) {
  return useQuery({
    enabled: Boolean(projectId),
    queryKey: ["subtask-pairs", projectId, revision],
    queryFn: () => getSubtaskPairs(projectId),
    placeholderData: (previous) => previous,
  });
}

export default useGetSubtaskPairs;
