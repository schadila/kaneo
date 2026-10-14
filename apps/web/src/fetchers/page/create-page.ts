import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";
import { HttpError } from "@/lib/http-error";

export type CreatePageRequest = InferRequestType<
  (typeof client)["page"]["$post"]
>["json"];

async function createPage(json: CreatePageRequest) {
  const response = await client.page.$post({ json });

  if (!response.ok) {
    throw await HttpError.fromResponse(response);
  }

  return response.json();
}

export default createPage;
