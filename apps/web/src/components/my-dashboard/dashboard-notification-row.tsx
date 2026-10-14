import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { NotificationIcon } from "@/components/inbox/notification-icon";
import {
  getNotificationContent,
  getNotificationTitle,
} from "@/components/notification/notification-text";
import useMarkNotificationAsRead from "@/hooks/mutations/notification/use-mark-notification-as-read";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/format";
import type { Notification } from "@/types/notification";
import { notificationTarget } from "./notification-target";

type DashboardNotificationRowProps = {
  notification: Notification;
  workspaceName?: string;
};

export function DashboardNotificationRow({
  notification,
  workspaceName,
}: DashboardNotificationRowProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const target = notificationTarget(notification);
  const isMention =
    notification.type === "task_mention" ||
    notification.type === "page_mention";

  const open = () => {
    if (!notification.isRead) markAsRead(notification.id);
    if (target?.kind === "task") {
      navigate({
        to: "/dashboard/workspace/$workspaceId/project/$projectId/task/$taskId",
        params: target,
      });
    } else if (target?.kind === "page") {
      navigate(
        target.projectId
          ? {
              to: "/dashboard/workspace/$workspaceId/project/$projectId/docs",
              params: {
                workspaceId: target.workspaceId,
                projectId: target.projectId,
              },
              search: { page: target.pageId },
            }
          : {
              to: "/dashboard/workspace/$workspaceId/wiki",
              params: { workspaceId: target.workspaceId },
              search: { page: target.pageId },
            },
      );
    }
  };

  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        "flex w-full items-start gap-2.5 border-border/50 border-b px-4 py-2.5 text-left outline-none transition-colors last:border-b-0 hover:bg-accent/50 focus-visible:bg-accent/50",
        isMention && !notification.isRead && "bg-primary/5",
      )}
    >
      <NotificationIcon type={notification.type} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "truncate text-[13px]",
            notification.isRead
              ? "text-muted-foreground"
              : "font-medium text-foreground",
          )}
        >
          {getNotificationTitle(notification, t)}
        </span>
        <span className="truncate text-muted-foreground text-xs">
          {getNotificationContent(notification, t)}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-0.5 text-muted-foreground text-xs">
        <time dateTime={notification.createdAt}>
          {formatRelativeTime(notification.createdAt, i18n.language)}
        </time>
        {workspaceName && (
          <span className="max-w-28 truncate">{workspaceName}</span>
        )}
      </span>
      {!notification.isRead && (
        <span
          aria-label={t("workspace:dashboard.unread")}
          className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
        />
      )}
    </button>
  );
}
