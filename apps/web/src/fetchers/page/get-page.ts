import { client } from "@kaneo/libs";
import { HttpError } from "@/lib/http-error";

async function getPage(id: string) {
  const response = await client.page[":id"].$get({ param: { id } });

  if (!response.ok) {
    throw await HttpError.fromResponse(response);
  }

  return response.json();
}

export default getPage;
