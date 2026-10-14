import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db, { schema } from "../database";
import { assertProjectAccess } from "../project-access/assert-project-access";

// Project docs: the project must live in the authorized workspace and be
// visible to the caller (restricted members only see granted projects).
export async function assertProjectScope(
  userId: string,
  workspaceId: string,
  projectId: string,
) {
  const [project] = await db
    .select({ id: schema.projectTable.id })
    .from(schema.projectTable)
    .where(
      and(
        eq(schema.projectTable.id, projectId),
        eq(schema.projectTable.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  if (!project) throw new HTTPException(404, { message: "Project not found" });
  await assertProjectAccess(userId, projectId);
}
