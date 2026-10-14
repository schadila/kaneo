import { asc, eq } from "drizzle-orm";
import db from "../../database";
import { taskTemplateTable } from "../task-template-table";

function listTemplates(workspaceId: string) {
  return db
    .select()
    .from(taskTemplateTable)
    .where(eq(taskTemplateTable.workspaceId, workspaceId))
    .orderBy(asc(taskTemplateTable.name));
}

export default listTemplates;
