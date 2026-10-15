import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AtSign } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import getNotifications from "@/fetchers/notification/get-notifications";
import markAllNotificationsAsRead from "@/fetchers/notification/mark-all-notifications-as-read";
import useGetWorkspaces from "@/hooks/queries/workspace/use-get-workspaces";
import { cn } from "@/lib/cn";
import { DashboardNotificationRow } from "./dashboard-notification-row";
import { DashboardSection } from "./dashboard-section";
import { notificationWorkspaceId } from "./notification-target";

type Filter = "unread" | "mentions" | "all";

const MENTION_TYPES = new Set(["task_mention", "page_mention"]);

export function MyInboxSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("unread");
  const { data: workspaceList } = useGetWorkspaces();
  const workspaces = useMemo(() => workspaceList ?? [], [workspaceList]);
  // No workspaceId: the API returns notifications from every workspace.
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", "all-workspaces"],
    queryFn: () => getNotifications(),
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });
  const { mutate: markAllRead, isPending } = useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const workspaceNames = useMemo(
    () => new Map(workspaces.map((ws) => [ws.id, ws.name])),
    [workspaces],
  );
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const visible = notifications.filter((notification) =>
    filter === "unread"
      ? !notification.isRead
      : filter === "mentions"
        ? MENTION_TYPES.has(notification.type)
        : true,
  );

  const filters: Array<{ id: Filter; label: string }> = [
    { id: "unread", label: t("workspace:dashboard.filterUnread") },
    { id: "mentions", label: t("workspace:dashboard.filterMentions") },
    { id: "all", label: t("workspace:dashboard.filterAll") },
  ];

  return (
    <DashboardSection
      icon={AtSign}
      title={t("workspace:dashboard.inbox")}
      count={unreadCount}
      actions={
        unreadCount > 0 ? (
          <Button
            variant="ghost"
            size="xs"
            disabled={isPending}
            onClick={() => markAllRead()}
          >
            {t("workspace:dashboard.markAllRead")}
          </Button>
        ) : null
      }
    >
      <div className="flex gap-1 border-border/60 border-b px-3 py-1.5">
        {filters.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-pressed={filter === entry.id}
            onClick={() => setFilter(entry.id)}
            className={cn(
              "h-6 rounded-md px-2 font-medium text-xs transition-colors",
              filter === entry.id
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="flex justify-center p-6">
          <Spinner />
        </div>
      ) : visible.length === 0 ? (
        <p className="px-4 py-6 text-muted-foreground text-sm">
          {t("workspace:dashboard.noNotifications")}
        </p>
      ) : (
        <div className="flex max-h-[32rem] flex-col overflow-y-auto">
          {visible.map((notification) => {
            const workspaceId = notificationWorkspaceId(notification);
            return (
              <DashboardNotificationRow
                key={notification.id}
                notification={notification}
                workspaceName={
                  workspaces.length > 1 && workspaceId
                    ? workspaceNames.get(workspaceId)
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
    </DashboardSection>
  );
}
