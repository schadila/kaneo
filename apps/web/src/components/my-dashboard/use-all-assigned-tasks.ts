import { useQueries } from "@tanstack/react-query";
import getAssignedTasks, {
  type AssignedTask,
} from "@/fetchers/task/get-assigned-tasks";
import useGetWorkspaces from "@/hooks/queries/workspace/use-get-workspaces";

export type DashboardTask = AssignedTask & {
  workspaceId: string;
  workspaceName: string;
};

// The assigned-tasks API is per workspace (it enforces that workspace's
// permissions), so the cross-workspace list is one request per workspace,
// merged and re-sorted by due date client-side.
export function useAllAssignedTasks() {
  const { data: workspaceList, isLoading: workspacesLoading } =
    useGetWorkspaces();
  const workspaces = workspaceList ?? [];

  return useQueries({
    queries: workspaces.map((workspace) => ({
      queryKey: ["assigned-tasks", workspace.id, { countOnly: false }],
      queryFn: () => getAssignedTasks(workspace.id),
    })),
    combine: (results) => {
      const tasks: DashboardTask[] = results.flatMap((result, index) => {
        const workspace = workspaces[index];
        if (!workspace || !result.data) return [];
        return result.data.tasks.map((task) => ({
          ...task,
          workspaceId: workspace.id,
          workspaceName: workspace.name,
        }));
      });
      tasks.sort((a, b) => {
        if (!a.dueDate) return b.dueDate ? 1 : 0;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
      return {
        tasks,
        total: results.reduce(
          (sum, result) => sum + (result.data?.total ?? 0),
          0,
        ),
        isLoading:
          workspacesLoading || results.some((result) => result.isLoading),
        failedWorkspaces: results.filter((result) => result.isError).length,
      };
    },
  });
}
