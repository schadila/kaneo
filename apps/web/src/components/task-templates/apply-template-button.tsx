import { ListChecks } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { ApplyTemplateDialog } from "./apply-template-dialog";

type ApplyTemplateButtonProps = {
  workspaceId: string;
  projectId: string;
};

// Toolbar entry in task views: create a set of tasks from a template.
export function ApplyTemplateButton({
  workspaceId,
  projectId,
}: ApplyTemplateButtonProps) {
  const { t } = useTranslation();
  const { canCreateTasks } = useWorkspacePermission();
  const [open, setOpen] = useState(false);

  if (!canCreateTasks()) return null;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="gap-1.5 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <ListChecks className="size-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">
          {t("workspace:templates.apply")}
        </span>
      </Button>
      <ApplyTemplateDialog
        open={open}
        onOpenChange={setOpen}
        workspaceId={workspaceId}
        projectId={projectId}
      />
    </>
  );
}
