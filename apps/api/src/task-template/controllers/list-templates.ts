import { asc, eq } from "drizzle-orm";
import db from "../../database";
import { normalizeTemplate } from "../normalize-template";
import { taskTemplateTable } from "../task-template-table";

async function listTemplates(workspaceId: string) {
  const templates = await db
    .select()
    .from(taskTemplateTable)
    .where(eq(taskTemplateTable.workspaceId, workspaceId))
    .orderBy(asc(taskTemplateTable.name));
  return templates.map(normalizeTemplate);
}

export default listTemplates;
