import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useCallback, useContext, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "@/components/providers/auth-provider";
import { ConfirmDialog } from "@/components/settings/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import useDeletePage from "@/hooks/mutations/page/use-delete-page";
import useUpdatePage from "@/hooks/mutations/page/use-update-page";
import { formatRelativeTime } from "@/lib/format";
import { toast } from "@/lib/toast";
import { PageEditor } from "./page-editor";
import { pageSaveQueue } from "./page-save-queue";
import { useMentionMembers } from "./use-mention-members";
import type { PageDetail } from "./page-types";

type PageViewProps = {
  page: PageDetail;
  canEdit: boolean;
  onAddChild: (parentId: string) => void;
  onDeleted: (page: PageDetail) => void;
};

export function PageView({
  page,
  canEdit,
  onAddChild,
  onDeleted,
}: PageViewProps) {
  const { t, i18n } = useTranslation();
  const ownerId = useContext(AuthContext).user?.id ?? "";
  const { mutateAsync: updatePage } = useUpdatePage();
  const { mutate: deletePage, isPending: isDeleting } = useDeletePage();
  const [title, setTitle] = useState(page.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const mentionMembers = useMentionMembers(page.workspaceId, page.projectId);
  const saveState = useSyncExternalStore(
    pageSaveQueue.subscribe,
    () => pageSaveQueue.get(page.id, ownerId)?.state ?? "saved",
  );

  const saveContent = useCallback(
    (content: string) =>
      pageSaveQueue.schedule(
        page.id,
        content,
        (value) => updatePage({ id: page.id, content: value }),
        ownerId,
      ),
    [ownerId, page.id, updatePage],
  );

  const commitTitle = () => {
    const next = title.trim();
    if (next === page.title) return;
    updatePage({ id: page.id, title: next }).catch(() =>
      toast.error(t("workspace:pages.saveFailed")),
    );
  };

  const handleDelete = () =>
    deletePage(page.id, {
      onSuccess: () => {
        setConfirmDelete(false);
        onDeleted(page);
      },
      onError: () => toast.error(t("workspace:pages.deleteFailed")),
    });

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-8 sm:px-8">
      <div className="flex items-center justify-between gap-2 text-muted-foreground text-xs">
        <span>
          {saveState === "saved"
            ? t("workspace:pages.updated", {
                time: formatRelativeTime(page.updatedAt, i18n.language),
              })
            : saveState === "failed"
              ? t("tasks:detail.editor.saveFailed")
              : t("tasks:detail.editor.saving")}
        </span>
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex size-6 items-center justify-center rounded-md hover:bg-accent hover:text-foreground"
                />
              }
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">{t("workspace:pages.actions")}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-44" align="end">
              <DropdownMenuItem
                className="h-7 cursor-pointer gap-2 text-sm"
                onClick={() => onAddChild(page.id)}
              >
                <Plus className="size-3.5" />
                {t("workspace:pages.addSubpage")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="h-7 cursor-pointer gap-2 text-destructive text-sm"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-3.5" />
                {t("workspace:pages.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <input
        value={title}
        readOnly={!canEdit}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={commitTitle}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        placeholder={t("workspace:pages.untitled")}
        aria-label={t("workspace:pages.titleLabel")}
        maxLength={500}
        className="w-full bg-transparent font-semibold text-3xl tracking-tight outline-none placeholder:text-muted-foreground/50"
      />

      <PageEditor
        key={page.id}
        initialMarkdown={
          pageSaveQueue.get(page.id, ownerId)?.value ?? page.content
        }
        canEdit={canEdit}
        mentionMembers={mentionMembers}
        onChange={saveContent}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("workspace:pages.deleteTitle")}
        description={t("workspace:pages.deleteDescription")}
        confirmLabel={t("workspace:pages.delete")}
        pending={isDeleting}
        onConfirm={handleDelete}
      />
    </article>
  );
}
