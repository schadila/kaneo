import { client } from "@kaneo/libs";
import { HttpError } from "@/lib/http-error";

export type ListPagesRequest = {
  workspaceId: string;
  projectId?: string;
};

async function listPages({ workspaceId, projectId }: ListPagesRequest) {
  const response = await client.page.workspace[":workspaceId"].$get({
    param: { workspaceId },
    query: projectId ? { projectId } : {},
  });

  if (!response.ok) {
    throw await HttpError.fromResponse(response);
  }

  return response.json();
}

export default listPages;
