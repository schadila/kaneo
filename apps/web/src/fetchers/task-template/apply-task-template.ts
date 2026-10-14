import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";
import { HttpError } from "@/lib/http-error";

export type ApplyTaskTemplateRequest = { id: string } & InferRequestType<
  (typeof client)["task-template"][":id"]["apply"]["$post"]
>["json"];

async function applyTaskTemplate({ id, ...json }: ApplyTaskTemplateRequest) {
  const response = await client["task-template"][":id"].apply.$post({
    param: { id },
    json,
  });

  if (!response.ok) {
    throw await HttpError.fromResponse(response);
  }

  return response.json();
}

export default applyTaskTemplate;
