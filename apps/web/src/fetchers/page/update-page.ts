import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";
import { HttpError } from "@/lib/http-error";

export type UpdatePageRequest = { id: string } & InferRequestType<
  (typeof client)["page"][":id"]["$put"]
>["json"];

async function updatePage({ id, ...json }: UpdatePageRequest) {
  const response = await client.page[":id"].$put({ param: { id }, json });

  if (!response.ok) {
    throw await HttpError.fromResponse(response);
  }

  return response.json();
}

export default updatePage;
