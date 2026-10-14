import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  type TaskTemplateItem,
  taskTemplateTable,
} from "../task-template-table";

type UpdateTemplateInput = {
  name: string;
  description: string;
  items: TaskTemplateItem[];
};

async function updateTemplate(
  id: string,
  userId: string,
  input: UpdateTemplateInput,
) {
  const [template] = await db
    .update(taskTemplateTable)
    .set({ ...input, updatedBy: userId })
    .where(eq(taskTemplateTable.id, id))
    .returning();
  if (!template)
    throw new HTTPException(404, { message: "Template not found" });
  return template;
}

export default updateTemplate;
