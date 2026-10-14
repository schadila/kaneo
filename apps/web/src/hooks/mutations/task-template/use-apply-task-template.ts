import { useMutation, useQueryClient } from "@tanstack/react-query";
import applyTaskTemplate from "@/fetchers/task-template/apply-task-template";

function useApplyTaskTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applyTaskTemplate,
    onSuccess: (_result, variables) => {
      // Same refreshes as creating a single task.
      void queryClient.invalidateQueries({
        queryKey: ["tasks", variables.projectId],
      });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["assigned-tasks"] });
    },
  });
}

export default useApplyTaskTemplate;
