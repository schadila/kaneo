import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { useUserPreferencesStore } from "@/store/user-preferences";
import { ProjectScopeLink } from "./project-scope-link";
import { type ProjectView, tasksViewFor } from "./project-views";

type ProjectScopeToggleProps = {
  workspaceId: string;
  projectId: string;
  currentView: ProjectView;
  onSelect: (view: ProjectView) => void;
  docsActive?: boolean;
};

export function ProjectScopeToggle({
  workspaceId,
  projectId,
  currentView,
  onSelect,
  docsActive = false,
}: ProjectScopeToggleProps) {
  const { t } = useTranslation();
  const taskLayout = useUserPreferencesStore((state) => state.taskLayout);
  const viewMode = useUserPreferencesStore((state) => state.viewMode);
  const onBacklog = currentView === "backlog";
  const tasksView =
    onBacklog || docsActive ? tasksViewFor(taskLayout, viewMode) : currentView;

  return (
    <nav
      aria-label={t("tasks:view.heading")}
      className="flex h-7 shrink-0 items-center gap-0.5 rounded-lg border border-border/80 bg-background p-0.5 dark:bg-input/32"
    >
      <ProjectScopeLink
        view={tasksView}
        workspaceId={workspaceId}
        projectId={projectId}
        active={!onBacklog && !docsActive}
        onSelect={onSelect}
      >
        {t("tasks:title")}
      </ProjectScopeLink>
      <ProjectScopeLink
        view="backlog"
        workspaceId={workspaceId}
        projectId={projectId}
        active={onBacklog && !docsActive}
        onSelect={onSelect}
      >
        {t("tasks:view.backlog")}
      </ProjectScopeLink>
      <Link
        to="/dashboard/workspace/$workspaceId/project/$projectId/docs"
        params={{ workspaceId, projectId }}
        aria-current={docsActive ? "page" : undefined}
        className={cn(
          "inline-flex h-6 items-center rounded-md px-2.5 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
          docsActive
            ? "bg-accent text-foreground shadow-xs/5"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {t("workspace:pages.docsTitle")}
      </Link>
    </nav>
  );
}
