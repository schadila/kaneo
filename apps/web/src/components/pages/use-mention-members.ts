import { useMemo } from "react";
import type { MentionMember } from "@/components/task/extensions/mention-list";
import { useGetActiveWorkspaceUsers } from "@/hooks/queries/workspace-users/use-get-active-workspace-users";
import useGetProjectMembers from "@/hooks/queries/workspace-users/use-get-project-members";

// Who can be @mentioned on a page: project members for project docs (the
// only people who can open them), otherwise every workspace member.
export function useMentionMembers(
  workspaceId: string,
  projectId: string | null,
): MentionMember[] {
  const { data: workspaceUsers } = useGetActiveWorkspaceUsers(
    projectId ? "" : workspaceId,
  );
  const { data: projectMembers } = useGetProjectMembers({
    workspaceId,
    projectId: projectId ?? "",
  });

  return useMemo(
    () =>
      projectId
        ? (projectMembers ?? []).map((member) => ({
            id: member.id,
            label: member.name || member.email,
            image: member.image,
          }))
        : (workspaceUsers?.members ?? []).map((member) => ({
            id: member.userId,
            label: member.user?.name ?? member.user?.email ?? "",
            image: member.user?.image ?? null,
          })),
    [projectId, projectMembers, workspaceUsers],
  );
}
