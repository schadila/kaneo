import { useMutation, useQueryClient } from "@tanstack/react-query";
import deleteTaskTemplate from "@/fetchers/task-template/delete-task-template";

function useDeleteTaskTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTaskTemplate,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["task-templates"] }),
  });
}

export default useDeleteTaskTemplate;
