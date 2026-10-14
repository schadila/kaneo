import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";
import { HttpError } from "@/lib/http-error";

type TemplateFields = InferRequestType<
  (typeof client)["task-template"][":id"]["$put"]
>["json"];

export type SaveTaskTemplateRequest = TemplateFields &
  ({ id: string } | { workspaceId: string });

// Creates a template without id, replaces the existing one with id.
async function saveTaskTemplate(request: SaveTaskTemplateRequest) {
  const { name, description, items } = request;
  const response =
    "workspaceId" in request
      ? await client["task-template"].$post({
          json: { workspaceId: request.workspaceId, name, description, items },
        })
      : await client["task-template"][":id"].$put({
          param: { id: request.id },
          json: { name, description, items },
        });

  if (!response.ok) {
    throw await HttpError.fromResponse(response);
  }

  return response.json();
}

export default saveTaskTemplate;
