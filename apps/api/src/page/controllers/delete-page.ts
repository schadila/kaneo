import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { pageTable } from "../page-table";

// Subpages go with their parent (parent_id cascades).
async function deletePage(id: string) {
  const [page] = await db
    .delete(pageTable)
    .where(eq(pageTable.id, id))
    .returning();
  if (!page) throw new HTTPException(404, { message: "Page not found" });
  return page;
}

export default deletePage;
