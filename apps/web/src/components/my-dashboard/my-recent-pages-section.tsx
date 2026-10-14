import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageLink } from "@/components/pages/page-link";
import { Spinner } from "@/components/ui/spinner";
import useGetRecentPages from "@/hooks/queries/page/use-get-recent-pages";
import { formatRelativeTime } from "@/lib/format";
import { DashboardSection } from "./dashboard-section";

export function MyRecentPagesSection() {
  const { t, i18n } = useTranslation();
  const { data: pages = [], isLoading } = useGetRecentPages();

  return (
    <DashboardSection
      icon={FileText}
      title={t("workspace:dashboard.recentPages")}
    >
      {isLoading ? (
        <div className="flex justify-center p-6">
          <Spinner />
        </div>
      ) : pages.length === 0 ? (
        <p className="px-4 py-6 text-muted-foreground text-sm">
          {t("workspace:dashboard.noRecentPages")}
        </p>
      ) : (
        <ul className="flex flex-col">
          {pages.map((page) => (
            <li key={page.id}>
              <PageLink
                workspaceId={page.workspaceId}
                projectId={page.projectId}
                pageId={page.id}
                className="flex items-center gap-2.5 border-border/50 border-b px-4 py-2 outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/50"
              >
                <span className="flex w-4 shrink-0 justify-center text-[13px]">
                  {page.icon ?? (
                    <FileText className="size-3.5 text-muted-foreground" />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] text-foreground">
                    {page.title || t("workspace:pages.untitled")}
                  </span>
                  <span className="truncate text-muted-foreground text-xs">
                    {page.projectName
                      ? `${page.workspaceName} · ${page.projectName}`
                      : `${page.workspaceName} · ${t("workspace:pages.wikiTitle")}`}
                  </span>
                </span>
                <time
                  dateTime={page.updatedAt}
                  className="shrink-0 text-muted-foreground text-xs"
                >
                  {formatRelativeTime(page.updatedAt, i18n.language)}
                </time>
              </PageLink>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}
