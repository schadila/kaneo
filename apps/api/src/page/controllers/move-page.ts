import { and, asc, eq, isNull, ne, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { pageTable } from "../page-table";

// Renumbering siblings is not an edit of their content: keep their
// "updated" time (it drives "Aktualisiert vor …" and recent pages).
const keepUpdatedAt = sql`${pageTable.updatedAt}`;

type MovePageInput = {
  parentId: string | null;
  // Position among the new siblings (0 = first); clamped to the list length.
  index: number;
};

// Moves a page to another parent and/or position inside the same wiki or
// project docs, renumbering the affected siblings.
async function movePage(id: string, userId: string, input: MovePageInput) {
  return db.transaction(async (tx) => {
    const [page] = await tx
      .select()
      .from(pageTable)
      .where(eq(pageTable.id, id))
      .for("update")
      .limit(1);
    if (!page) throw new HTTPException(404, { message: "Page not found" });

    // Serialize moves within one tree so concurrent renumbering cannot
    // interleave.
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`page-tree:${page.workspaceId}:${page.projectId ?? ""}`}))`,
    );

    const parentId = input.parentId;
    if (parentId) {
      if (parentId === id)
        throw new HTTPException(400, {
          message: "A page cannot be its own parent",
        });
      const [parent] = await tx
        .select({
          workspaceId: pageTable.workspaceId,
          projectId: pageTable.projectId,
        })
        .from(pageTable)
        .where(eq(pageTable.id, parentId))
        .limit(1);
      if (
        !parent ||
        parent.workspaceId !== page.workspaceId ||
        parent.projectId !== page.projectId
      )
        throw new HTTPException(400, {
          message: "Target parent is not in the same wiki or project docs",
        });

      // Walk up from the new parent; meeting the page means a cycle.
      const ancestors = await tx.execute<{ id: string }>(sql`
        WITH RECURSIVE chain AS (
          SELECT id, parent_id FROM page WHERE id = ${parentId}
          UNION
          SELECT p.id, p.parent_id FROM page p JOIN chain c ON p.id = c.parent_id
        )
        SELECT id FROM chain
      `);
      if (ancestors.rows.some((row) => row.id === id))
        throw new HTTPException(400, {
          message: "A page cannot be moved into its own subpage",
        });
    }

    const siblingScope = (parent: string | null) =>
      and(
        eq(pageTable.workspaceId, page.workspaceId),
        page.projectId
          ? eq(pageTable.projectId, page.projectId)
          : isNull(pageTable.projectId),
        parent ? eq(pageTable.parentId, parent) : isNull(pageTable.parentId),
        ne(pageTable.id, id),
      );

    const siblings = await tx
      .select({ id: pageTable.id })
      .from(pageTable)
      .where(siblingScope(parentId))
      .orderBy(asc(pageTable.position), asc(pageTable.createdAt));
    const index = Math.max(0, Math.min(input.index, siblings.length));
    const ordered = [
      ...siblings.slice(0, index).map((s) => s.id),
      id,
      ...siblings.slice(index).map((s) => s.id),
    ];
    for (const [position, pageId] of ordered.entries()) {
      await tx
        .update(pageTable)
        .set(
          pageId === id
            ? { parentId, position, updatedBy: userId }
            : { position, updatedAt: keepUpdatedAt },
        )
        .where(eq(pageTable.id, pageId));
    }

    // Close the gap the page left behind in its old parent.
    if (page.parentId !== parentId) {
      const oldSiblings = await tx
        .select({ id: pageTable.id })
        .from(pageTable)
        .where(siblingScope(page.parentId))
        .orderBy(asc(pageTable.position), asc(pageTable.createdAt));
      for (const [position, sibling] of oldSiblings.entries()) {
        await tx
          .update(pageTable)
          .set({ position, updatedAt: keepUpdatedAt })
          .where(eq(pageTable.id, sibling.id));
      }
    }

    const [moved] = await tx
      .select()
      .from(pageTable)
      .where(eq(pageTable.id, id))
      .limit(1);
    if (!moved) throw new Error("Moved page disappeared");
    return moved;
  });
}

export default movePage;
