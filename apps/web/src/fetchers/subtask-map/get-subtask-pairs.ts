import { client } from "@kaneo/libs";
import { HttpError } from "@/lib/http-error";

async function getSubtaskPairs(projectId: string) {
  const response = await client["subtask-map"].project[":projectId"].$get({
    param: { projectId },
  });

  if (!response.ok) {
    throw await HttpError.fromResponse(response);
  }

  return response.json();
}

export default getSubtaskPairs;
