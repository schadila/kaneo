import { and, eq, inArray } from "drizzle-orm";
import db, { schema } from "../database";
import createNotification from "../notification/controllers/create-notification";
import { filterUsersWithProjectAccess } from "../project-access/filter-users-with-project-access";
import { parseMentionIds } from "../utils/parse-mentions";
import type { pageTable } from "./page-table";

type Page = typeof pageTable.$inferSelect;

// Notifies users newly @mentioned in a page. Notifications use the
// "workspace" resource type, which Kaneo's notification access rules already
// understand, so only members who can see the page are notified here.
export async function notifyPageMentions(
  previousContent: string,
  page: Page,
  authorId: string,
) {
  const before = new Set(parseMentionIds(previousContent));
  const candidates = parseMentionIds(page.content).filter(
    (id) => id !== authorId && !before.has(id),
  );
  if (candidates.length === 0) return;

  const members = await db
    .select({ userId: schema.workspaceUserTable.userId })
    .from(schema.workspaceUserTable)
    .where(
      and(
        eq(schema.workspaceUserTable.workspaceId, page.workspaceId),
        inArray(schema.workspaceUserTable.userId, candidates),
      ),
    );
  let recipients = members.map((member) => member.userId);
  if (page.projectId) {
    const allowed = await filterUsersWithProjectAccess(
      recipients,
      page.projectId,
    );
    recipients = recipients.filter((id) => allowed.has(id));
  }
  if (recipients.length === 0) return;

  const [author] = await db
    .select({ name: schema.userTable.name })
    .from(schema.userTable)
    .where(eq(schema.userTable.id, authorId))
    .limit(1);
  const mentionerName = author?.name ?? "Someone";
  const pageTitle = page.title || "Untitled";

  for (const userId of recipients) {
    await createNotification({
      userId,
      type: "page_mention",
      // Plain-text fallback for e-mail/webhook delivery; the web app renders
      // its own localized text from eventData.
      title: `${mentionerName} mentioned you`,
      content: `${mentionerName} mentioned you in: ${pageTitle}`,
      eventData: {
        pageId: page.id,
        pageTitle,
        projectId: page.projectId,
        workspaceId: page.workspaceId,
        mentionerName,
      },
      resourceId: page.workspaceId,
      resourceType: "workspace",
    });
  }
}
