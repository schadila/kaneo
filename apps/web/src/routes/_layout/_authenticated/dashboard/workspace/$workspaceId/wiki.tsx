import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import WorkspaceLayout from "@/components/common/workspace-layout";
import PageTitle from "@/components/page-title";
import { PagesWorkspace } from "@/components/pages/pages-workspace";

type WikiSearchParams = { page?: string };

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/wiki",
)({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): WikiSearchParams => ({
    page: typeof search.page === "string" ? search.page : undefined,
  }),
});

function RouteComponent() {
  const { t } = useTranslation();
  const { workspaceId } = Route.useParams();
  const { page } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <>
      <PageTitle title={t("workspace:pages.wikiTitle")} />
      <WorkspaceLayout title={t("workspace:pages.wikiTitle")}>
        <PagesWorkspace
          workspaceId={workspaceId}
          pageId={page}
          onNavigate={(pageId) => navigate({ search: { page: pageId } })}
        />
      </WorkspaceLayout>
    </>
  );
}
