import { getEventDataRecord } from "@/components/notification/notification-text";
import { pageMentionTarget } from "@/components/pages/page-mention-target";
import type { Notification } from "@/types/notification";

export type NotificationTarget =
  | {
      kind: "task";
      workspaceId: string;
      projectId: string;
      taskId: string;
    }
  | {
      kind: "page";
      workspaceId: string;
      projectId: string | null;
      pageId: string;
    };

// Where clicking a notification should go. The API enriches task
// notifications with the task's current workspace and project.
export function notificationTarget(
  notification: Notification,
): NotificationTarget | null {
  const page = pageMentionTarget(notification);
  if (page) return { kind: "page", ...page };

  const data = getEventDataRecord(notification.eventData);
  if (
    notification.resourceType === "task" &&
    notification.resourceId &&
    typeof data?.workspaceId === "string" &&
    typeof data.projectId === "string"
  ) {
    return {
      kind: "task",
      workspaceId: data.workspaceId,
      projectId: data.projectId,
      taskId: notification.resourceId,
    };
  }
  return null;
}

export function notificationWorkspaceId(notification: Notification) {
  const data = getEventDataRecord(notification.eventData);
  return typeof data?.workspaceId === "string" ? data.workspaceId : null;
}
