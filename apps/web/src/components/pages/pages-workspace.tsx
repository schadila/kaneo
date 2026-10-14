import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import useCreatePage from "@/hooks/mutations/page/use-create-page";
import useMovePage from "@/hooks/mutations/page/use-move-page";
import useGetPage from "@/hooks/queries/page/use-get-page";
import useGetPages from "@/hooks/queries/page/use-get-pages";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { toast } from "@/lib/toast";
import { type MoveTarget, resolveStep } from "./page-move";
import { PageTree } from "./page-tree";
import { PageView } from "./page-view";

type PagesWorkspaceProps = {
  workspaceId: string;
  // Omitted for the workspace wiki; set for a project's docs.
  projectId?: string;
  pageId?: string;
  onNavigate: (pageId: string | undefined) => void;
};

export function PagesWorkspace({
  workspaceId,
  projectId,
  pageId,
  onNavigate,
}: PagesWorkspaceProps) {
  const { t } = useTranslation();
  const { canUpdateTasks } = useWorkspacePermission();
  const canEdit = Boolean(canUpdateTasks());
  const { data: pages = [], isLoading } = useGetPages(workspaceId, projectId);
  const { data: page, isError } = useGetPage(pageId);
  const { mutate: createPage, isPending: creating } = useCreatePage();
  const { mutate: movePage } = useMovePage(workspaceId, projectId);

  const handleMove = (id: string, target: MoveTarget) =>
    movePage(
      { id, ...target },
      { onError: () => toast.error(t("workspace:pages.moveFailed")) },
    );
  const stepTarget = (direction: -1 | 1) =>
    pageId ? resolveStep(pages, pageId, direction) : null;

  const handleCreate = (parentId: string | null) =>
    createPage(
      { workspaceId, projectId: projectId ?? null, parentId },
      {
        onSuccess: (created) => onNavigate(created.id),
        onError: () => toast.error(t("workspace:pages.createFailed")),
      },
    );

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <aside className="shrink-0 border-border/80 border-b p-2 md:w-64 md:overflow-y-auto md:border-r md:border-b-0">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Spinner />
          </div>
        ) : (
          <PageTree
            pages={pages}
            activePageId={pageId}
            canEdit={canEdit}
            creating={creating}
            onSelect={onNavigate}
            onCreate={handleCreate}
            onMove={handleMove}
          />
        )}
      </aside>
      <section className="min-h-0 flex-1 overflow-y-auto">
        {page && page.id === pageId ? (
          <PageView
            key={page.id}
            page={page}
            canEdit={canEdit}
            onAddChild={handleCreate}
            moveUp={stepTarget(-1)}
            moveDown={stepTarget(1)}
            onMove={(target) => handleMove(page.id, target)}
            onDeleted={(deleted) => onNavigate(deleted.parentId ?? undefined)}
          />
        ) : pageId && !isError ? (
          <div className="flex justify-center p-8">
            <Spinner />
          </div>
        ) : (
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>
                {isError
                  ? t("workspace:pages.notFound")
                  : projectId
                    ? t("workspace:pages.docsEmptyTitle")
                    : t("workspace:pages.wikiEmptyTitle")}
              </EmptyTitle>
              <EmptyDescription>
                {projectId
                  ? t("workspace:pages.docsEmptyDescription")
                  : t("workspace:pages.wikiEmptyDescription")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  );
}
