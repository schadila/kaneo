import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import db from "../database";
import { validateWorkspaceAccess } from "../utils/validate-workspace-access";
import { taskTemplateTable } from "./task-template-table";

const NOT_FOUND = "Template not found";

// Resolves the template from the `id` path param and authorizes against its
// workspace (same idea as page/page-access.ts).
export function templateAccess() {
  return async (c: Context, next: Next) => {
    const userId = c.get("userId");
    if (!userId) throw new HTTPException(401, { message: "Unauthorized" });

    const id = c.req.param("id");
    const [template] = id
      ? await db
          .select({ workspaceId: taskTemplateTable.workspaceId })
          .from(taskTemplateTable)
          .where(eq(taskTemplateTable.id, id))
          .limit(1)
      : [];
    if (!template) throw new HTTPException(404, { message: NOT_FOUND });

    await validateWorkspaceAccess(
      userId,
      template.workspaceId,
      c.get("apiKey")?.id,
      { notFoundMessage: NOT_FOUND },
    );
    c.set("workspaceId", template.workspaceId);
    return next();
  };
}
