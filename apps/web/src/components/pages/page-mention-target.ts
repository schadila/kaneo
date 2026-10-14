import { getEventDataRecord } from "@/components/notification/notification-text";
import type { Notification } from "@/types/notification";

export type PageMentionTarget = {
  workspaceId: string;
  projectId: string | null;
  pageId: string;
};

// Where a "page_mention" notification points, read from its eventData.
export function pageMentionTarget(
  notification: Notification,
): PageMentionTarget | null {
  if (notification.type !== "page_mention") return null;
  const data = getEventDataRecord(notification.eventData);
  if (typeof data?.pageId !== "string" || typeof data.workspaceId !== "string")
    return null;
  return {
    workspaceId: data.workspaceId,
    projectId: typeof data.projectId === "string" ? data.projectId : null,
    pageId: data.pageId,
  };
}
