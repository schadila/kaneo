import { useMutation, useQueryClient } from "@tanstack/react-query";
import saveTaskTemplate from "@/fetchers/task-template/save-task-template";

function useSaveTaskTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveTaskTemplate,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["task-templates"] }),
  });
}

export default useSaveTaskTemplate;
