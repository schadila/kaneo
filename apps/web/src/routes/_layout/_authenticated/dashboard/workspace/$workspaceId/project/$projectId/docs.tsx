import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import ProjectLayout from "@/components/common/project-layout";
import PageTitle from "@/components/page-title";
import { PagesWorkspace } from "@/components/pages/pages-workspace";

type DocsSearchParams = { page?: string };

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/project/$projectId/docs",
)({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): DocsSearchParams => ({
    page: typeof search.page === "string" ? search.page : undefined,
  }),
});

function RouteComponent() {
  const { t } = useTranslation();
  const { workspaceId, projectId } = Route.useParams();
  const { page } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <>
      <PageTitle title={t("workspace:pages.docsTitle")} />
      <ProjectLayout workspaceId={workspaceId} projectId={projectId}>
        <PagesWorkspace
          workspaceId={workspaceId}
          projectId={projectId}
          pageId={page}
          onNavigate={(pageId) => navigate({ search: { page: pageId } })}
        />
      </ProjectLayout>
    </>
  );
}
