import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { notifyPageMentions } from "../notify-page-mentions";
import { pageTable } from "../page-table";

type UpdatePageInput = {
  title?: string;
  icon?: string | null;
  content?: string;
};

async function updatePage(id: string, userId: string, input: UpdatePageInput) {
  const [previous] = await db
    .select({ content: pageTable.content })
    .from(pageTable)
    .where(eq(pageTable.id, id))
    .limit(1);
  if (!previous) throw new HTTPException(404, { message: "Page not found" });

  const [page] = await db
    .update(pageTable)
    .set({ ...input, updatedBy: userId })
    .where(eq(pageTable.id, id))
    .returning();
  if (!page) throw new HTTPException(404, { message: "Page not found" });

  if (input.content !== undefined && input.content !== previous.content) {
    // Autosave must not wait on (or fail because of) notification delivery.
    notifyPageMentions(previous.content, page, userId).catch((error) =>
      console.error("Failed to notify page mentions:", error),
    );
  }
  return page;
}

export default updatePage;
