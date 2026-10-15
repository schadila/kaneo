import db from "../../database";
import {
  type TaskTemplateItem,
  taskTemplateTable,
} from "../task-template-table";
import { normalizeTemplate } from "../normalize-template";

type CreateTemplateInput = {
  workspaceId: string;
  name: string;
  description: string;
  items: TaskTemplateItem[];
};

async function createTemplate(userId: string, input: CreateTemplateInput) {
  const [template] = await db
    .insert(taskTemplateTable)
    .values({ ...input, createdBy: userId, updatedBy: userId })
    .returning();
  if (!template) throw new Error("Failed to create template");
  return normalizeTemplate(template);
}

export default createTemplate;
