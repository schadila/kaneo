import { and, desc, eq, isNull, or } from "drizzle-orm";
import db, { schema } from "../../database";
import { projectAccessCondition } from "../../project-access/project-access-condition";
import { pageTable } from "../page-table";

// The caller's recently created/edited pages across all of their workspaces,
// limited to workspaces they belong to and projects they can see.
async function getRecentPages(userId: string, limit = 10) {
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
      workspaceName: schema.workspaceTable.name,
      projectName: schema.projectTable.name,
    })
    .from(pageTable)
    .innerJoin(
      schema.workspaceUserTable,
      and(
        eq(schema.workspaceUserTable.workspaceId, pageTable.workspaceId),
        eq(schema.workspaceUserTable.userId, userId),
      ),
    )
    .innerJoin(
      schema.workspaceTable,
      eq(schema.workspaceTable.id, pageTable.workspaceId),
    )
    .leftJoin(
      schema.projectTable,
      eq(schema.projectTable.id, pageTable.projectId),
    )
    .where(
      and(
        or(eq(pageTable.updatedBy, userId), eq(pageTable.createdBy, userId)),
        or(
          isNull(pageTable.projectId),
          projectAccessCondition(userId, pageTable.projectId),
        ),
      ),
    )
    .orderBy(desc(pageTable.updatedAt))
    .limit(limit);
}

export default getRecentPages;
