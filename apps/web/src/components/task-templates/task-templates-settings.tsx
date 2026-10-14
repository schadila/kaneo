import { ListChecks, Pencil, PlusIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/settings/confirm-dialog";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsEmpty } from "@/components/settings/settings-empty";
import { SettingsPage } from "@/components/settings/settings-page";
import { SettingsRowsSkeleton } from "@/components/settings/settings-rows-skeleton";
import { SettingsSection } from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import { Dialog, DialogPopup } from "@/components/ui/dialog";
import useDeleteTaskTemplate from "@/hooks/mutations/task-template/use-delete-task-template";
import useGetTaskTemplates from "@/hooks/queries/task-template/use-get-task-templates";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { toast } from "@/lib/toast";
import { TemplateForm } from "./template-form";
import type { TaskTemplate } from "./template-types";

export function TaskTemplatesSettings() {
  const { t } = useTranslation();
  const { workspace, canUpdateTasks } = useWorkspacePermission();
  const canEdit = Boolean(canUpdateTasks());
  const workspaceId = workspace?.id ?? "";
  const templatesQuery = useGetTaskTemplates(workspaceId);
  const deleteTemplate = useDeleteTaskTemplate();
  // undefined = closed, null = new template
  const [editing, setEditing] = useState<TaskTemplate | null | undefined>();
  const [deleting, setDeleting] = useState<TaskTemplate | null>(null);

  const newButton = canEdit ? (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setEditing(null)}
    >
      <PlusIcon aria-hidden="true" />
      {t("workspace:templates.newTemplate")}
    </Button>
  ) : null;

  const handleDelete = () => {
    if (!deleting) return;
    deleteTemplate.mutate(deleting.id, {
      onSuccess: () => {
        setDeleting(null);
        toast.success(t("workspace:templates.deleted"));
      },
      onError: () => toast.error(t("workspace:templates.deleteFailed")),
    });
  };

  const renderTemplates = () => {
    if (templatesQuery.isPending) return <SettingsRowsSkeleton />;
    const templates = templatesQuery.data ?? [];
    if (templates.length === 0)
      return (
        <SettingsEmpty
          icon={<ListChecks />}
          title={t("workspace:templates.emptyTitle")}
          description={t("workspace:templates.emptyDescription")}
          action={newButton}
        />
      );
    return templates.map((template) => (
      <div
        key={template.id}
        className="flex items-center gap-3 border-border/60 border-b px-4 py-3 last:border-b-0"
      >
        <ListChecks className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm">{template.name}</p>
          <p className="truncate text-muted-foreground text-xs">
            {t("workspace:templates.taskCount", {
              count: template.items.length,
            })}
            {template.description ? ` · ${template.description}` : ""}
          </p>
        </div>
        {canEdit && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("workspace:templates.editTemplate")}
              onClick={() => setEditing(template)}
            >
              <Pencil />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("workspace:templates.delete")}
              onClick={() => setDeleting(template)}
            >
              <Trash2 />
            </Button>
          </>
        )}
      </div>
    ));
  };

  return (
    <>
      <SettingsPage
        title={t("workspace:templates.title")}
        description={t("workspace:templates.subtitle")}
        actions={newButton}
      >
        <SettingsSection
          title={t("workspace:templates.sectionTitle")}
          description={t("workspace:templates.sectionDescription")}
        >
          <SettingsCard>{renderTemplates()}</SettingsCard>
        </SettingsSection>
      </SettingsPage>

      <Dialog
        open={editing !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
        }}
      >
        <DialogPopup className="sm:max-w-3xl">
          {editing !== undefined && (
            <TemplateForm
              key={editing?.id ?? "new"}
              template={editing}
              workspaceId={workspaceId}
              onClose={() => setEditing(undefined)}
            />
          )}
        </DialogPopup>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={t("workspace:templates.deleteTitle")}
        description={t("workspace:templates.deleteDescription", {
          name: deleting?.name ?? "",
        })}
        confirmLabel={t("workspace:templates.delete")}
        pending={deleteTemplate.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
