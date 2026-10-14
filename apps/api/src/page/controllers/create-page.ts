import { and, eq, isNull, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { pageTable } from "../page-table";
import { assertProjectScope } from "../assert-project-scope";

type CreatePageInput = {
  workspaceId: string;
  projectId?: string | null;
  parentId?: string | null;
  title?: string;
};

async function createPage(userId: string, input: CreatePageInput) {
  const { workspaceId, title = "" } = input;
  let projectId = input.projectId ?? null;
  const parentId = input.parentId ?? null;

  if (parentId) {
    const [parent] = await db
      .select({
        workspaceId: pageTable.workspaceId,
        projectId: pageTable.projectId,
      })
      .from(pageTable)
      .where(eq(pageTable.id, parentId))
      .limit(1);
    // A child always lives where its parent lives.
    if (!parent || parent.workspaceId !== workspaceId)
      throw new HTTPException(404, { message: "Parent page not found" });
    if (input.projectId !== undefined && input.projectId !== parent.projectId)
      throw new HTTPException(400, {
        message: "Parent page belongs to a different project",
      });
    projectId = parent.projectId;
  }

  if (projectId) await assertProjectScope(userId, workspaceId, projectId);

  const [last] = await db
    .select({ next: sql<number>`coalesce(max(${pageTable.position}), -1) + 1` })
    .from(pageTable)
    .where(
      and(
        eq(pageTable.workspaceId, workspaceId),
        projectId
          ? eq(pageTable.projectId, projectId)
          : isNull(pageTable.projectId),
        parentId
          ? eq(pageTable.parentId, parentId)
          : isNull(pageTable.parentId),
      ),
    );

  const [page] = await db
    .insert(pageTable)
    .values({
      workspaceId,
      projectId,
      parentId,
      title,
      position: Number(last?.next ?? 0),
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();
  if (!page) throw new Error("Failed to create page");
  return page;
}

export default createPage;
