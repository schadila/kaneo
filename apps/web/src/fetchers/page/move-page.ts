import { client } from "@kaneo/libs";
import { HttpError } from "@/lib/http-error";

export type MovePageRequest = {
  id: string;
  parentId: string | null;
  index: number;
};

async function movePage({ id, parentId, index }: MovePageRequest) {
  const response = await client.page[":id"].move.$put({
    param: { id },
    json: { parentId, index },
  });

  if (!response.ok) {
    throw await HttpError.fromResponse(response);
  }

  return response.json();
}

export default movePage;
