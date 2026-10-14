import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { taskTemplateTable } from "../task-template-table";

async function deleteTemplate(id: string) {
  const [template] = await db
    .delete(taskTemplateTable)
    .where(eq(taskTemplateTable.id, id))
    .returning();
  if (!template)
    throw new HTTPException(404, { message: "Template not found" });
  return template;
}

export default deleteTemplate;
