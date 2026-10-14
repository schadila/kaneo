import { and, asc, eq, isNull } from "drizzle-orm";
import db from "../../database";
import { pageTable } from "../page-table";
import { assertProjectScope } from "../assert-project-scope";

async function getPages(
  userId: string,
  workspaceId: string,
  projectId: string | undefined,
) {
  if (projectId) await assertProjectScope(userId, workspaceId, projectId);

  return db
    .select({
      id: pageTable.id,
      workspaceId: pageTable.workspaceId,
      projectId: pageTable.projectId,
      parentId: pageTable.parentId,
      title: pageTable.title,
      icon: pageTable.icon,
      position: pageTable.position,
      updatedAt: pageTable.updatedAt,
    })
    .from(pageTable)
    .where(
      and(
        eq(pageTable.workspaceId, workspaceId),
        projectId
          ? eq(pageTable.projectId, projectId)
          : isNull(pageTable.projectId),
      ),
    )
    .orderBy(asc(pageTable.position), asc(pageTable.createdAt));
}

export default getPages;
