import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import db from "../database";
import { pageTable } from "./page-table";
import { assertProjectAccess } from "../project-access/assert-project-access";
import { validateWorkspaceAccess } from "../utils/validate-workspace-access";

const PAGE_NOT_FOUND = "Page not found";

// Resolves the page from the `id` path param and authorizes against its
// workspace and, for project docs, its project — like workspaceAccess does
// for Kaneo's own resources.
export function pageAccess() {
  return async (c: Context, next: Next) => {
    const userId = c.get("userId");
    if (!userId) throw new HTTPException(401, { message: "Unauthorized" });

    const id = c.req.param("id");
    const [page] = id
      ? await db
          .select({
            workspaceId: pageTable.workspaceId,
            projectId: pageTable.projectId,
          })
          .from(pageTable)
          .where(eq(pageTable.id, id))
          .limit(1)
      : [];
    if (!page) throw new HTTPException(404, { message: PAGE_NOT_FOUND });

    await validateWorkspaceAccess(
      userId,
      page.workspaceId,
      c.get("apiKey")?.id,
      {
        notFoundMessage: PAGE_NOT_FOUND,
      },
    );
    if (page.projectId) await assertProjectAccess(userId, page.projectId);

    c.set("workspaceId", page.workspaceId);
    return next();
  };
}
