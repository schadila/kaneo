import { and, asc, eq, isNull } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { columnTable, labelTable } from "../../database/schema";
import createLabel from "../../label/controllers/create-label";
import { assertProjectScope } from "../../page/assert-project-scope";
import createTask from "../../task/controllers/create-task";
import { templateDueDate } from "../due-date";
import { taskTemplateTable } from "../task-template-table";

type ApplyTemplateInput = {
  projectId: string;
  status?: string;
  startDate?: string;
  assigneeId?: string | null;
};

// Creates one task per template item through Kaneo's own createTask, so task
// numbers, activity, notifications and integrations behave exactly as for
// tasks created by hand. Labels are copied from the workspace labels with the
// same name; unknown names are skipped.
async function applyTemplate(
  id: string,
  userId: string,
  input: ApplyTemplateInput,
) {
  const [template] = await db
    .select()
    .from(taskTemplateTable)
    .where(eq(taskTemplateTable.id, id))
    .limit(1);
  if (!template)
    throw new HTTPException(404, { message: "Template not found" });

  await assertProjectScope(userId, template.workspaceId, input.projectId);

  let status = input.status;
  if (!status) {
    const [first] = await db
      .select({ slug: columnTable.slug })
      .from(columnTable)
      .where(eq(columnTable.projectId, input.projectId))
      .orderBy(asc(columnTable.position))
      .limit(1);
    status = first?.slug ?? "to-do";
  }

  const workspaceLabels = await db
    .select({ name: labelTable.name, color: labelTable.color })
    .from(labelTable)
    .where(
      and(
        eq(labelTable.workspaceId, template.workspaceId),
        isNull(labelTable.taskId),
      ),
    );
  const labelColors = new Map(
    workspaceLabels.map((label) => [label.name, label.color]),
  );

  const start = input.startDate ? new Date(input.startDate) : new Date();
  const taskIds: string[] = [];
  for (const item of template.items) {
    const task = await createTask({
      projectId: input.projectId,
      currentUserId: userId,
      userId: input.assigneeId ?? undefined,
      title: item.title,
      status,
      description: item.description,
      priority: item.priority,
      dueDate: templateDueDate(start, item.dueOffsetDays),
    });
    taskIds.push(task.id);

    for (const name of item.labels) {
      const color = labelColors.get(name);
      if (color)
        await createLabel(name, color, task.id, template.workspaceId, userId);
    }
  }

  return { created: taskIds.length, taskIds };
}

export default applyTemplate;
