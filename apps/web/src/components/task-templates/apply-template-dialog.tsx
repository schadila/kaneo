import { ListChecks } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useApplyTaskTemplate from "@/hooks/mutations/task-template/use-apply-task-template";
import { useGetTasks } from "@/hooks/queries/task/use-get-tasks";
import useGetTaskTemplates from "@/hooks/queries/task-template/use-get-task-templates";
import useGetProjectMembers from "@/hooks/queries/workspace-users/use-get-project-members";
import { formatDateShort } from "@/lib/format";
import { getPriorityIcon } from "@/lib/priority";
import { toast } from "@/lib/toast";
import { addDays, localNoon, todayInput } from "./local-noon";

const NOBODY = "__nobody__";

type ApplyTemplateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  projectId: string;
};

export function ApplyTemplateDialog({
  open,
  onOpenChange,
  workspaceId,
  projectId,
}: ApplyTemplateDialogProps) {
  const { t } = useTranslation();
  const { data: templates = [] } = useGetTaskTemplates(workspaceId);
  const { data: project } = useGetTasks(projectId);
  const { data: members = [] } = useGetProjectMembers({
    workspaceId,
    projectId,
  });
  const applyTemplate = useApplyTaskTemplate();
  const [templateId, setTemplateId] = useState("");
  const [startDate, setStartDate] = useState(todayInput);
  const [status, setStatus] = useState("");
  const [assigneeId, setAssigneeId] = useState(NOBODY);
  const startId = useId();

  const columns = project?.columns ?? [];
  const template = templates.find((entry) => entry.id === templateId);
  const column = columns.find((entry) => entry.slug === status) ?? columns[0];
  const assignee = members.find((member) => member.id === assigneeId);
  const start = localNoon(startDate || todayInput());
  // Template items have no ids; their position within the template is stable.
  const preview = (template?.items ?? []).map((item, position) => ({
    ...item,
    previewKey: `${template?.id}-${position}`,
  }));

  const handleApply = async () => {
    if (!template) return;
    try {
      const result = await applyTemplate.mutateAsync({
        id: template.id,
        projectId,
        status: column?.slug,
        startDate: start.toISOString(),
        assigneeId: assigneeId === NOBODY ? null : assigneeId,
      });
      toast.success(
        t("workspace:templates.applied", { count: result.created }),
        { icon: ListChecks },
      );
      onOpenChange(false);
      setTemplateId("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("workspace:templates.applyFailed"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("workspace:templates.applyTitle")}</DialogTitle>
          <DialogDescription>
            {t("workspace:templates.applyDescription")}
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="space-y-4">
          {templates.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("workspace:templates.noTemplatesHint")}
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>{t("workspace:templates.template")}</Label>
                <Select
                  value={templateId}
                  onValueChange={(value) => {
                    if (typeof value === "string") setTemplateId(value);
                  }}
                >
                  <SelectTrigger aria-label={t("workspace:templates.template")}>
                    <SelectValue
                      placeholder={t("workspace:templates.pickTemplate")}
                    >
                      {template?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {entry.name} (
                        {t("workspace:templates.taskCount", {
                          count: entry.items.length,
                        })}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor={startId}>
                    {t("workspace:templates.startDate")}
                  </Label>
                  <Input
                    id={startId}
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("workspace:templates.column")}</Label>
                  <Select
                    value={column?.slug ?? ""}
                    onValueChange={(value) => {
                      if (typeof value === "string") setStatus(value);
                    }}
                  >
                    <SelectTrigger aria-label={t("workspace:templates.column")}>
                      <SelectValue>{column?.name}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((entry) => (
                        <SelectItem key={entry.slug} value={entry.slug}>
                          {entry.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("workspace:templates.assignee")}</Label>
                  <Select
                    value={assigneeId}
                    onValueChange={(value) => {
                      if (typeof value === "string") setAssigneeId(value);
                    }}
                  >
                    <SelectTrigger
                      aria-label={t("workspace:templates.assignee")}
                    >
                      <SelectValue>
                        {assignee
                          ? assignee.name || assignee.email
                          : t("workspace:templates.nobody")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NOBODY}>
                        {t("workspace:templates.nobody")}
                      </SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name || member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {template && (
                <div className="space-y-1">
                  <span className="block font-medium text-sm">
                    {t("workspace:templates.preview")}
                  </span>
                  <ul className="max-h-60 overflow-y-auto rounded-lg border border-border/80">
                    {preview.map((item) => (
                      <li
                        key={item.previewKey}
                        className="flex items-center gap-2 border-border/60 border-b px-3 py-1.5 text-sm last:border-b-0"
                      >
                        <span className="flex w-4 justify-center">
                          {getPriorityIcon(item.priority)}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {item.title}
                        </span>
                        {item.dueOffsetDays !== null && (
                          <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                            {formatDateShort(
                              addDays(start, item.dueOffsetDays),
                            )}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </DialogPanel>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common:actions.cancel")}
          </Button>
          <Button
            type="button"
            disabled={!template || applyTemplate.isPending}
            onClick={handleApply}
          >
            {template
              ? t("workspace:templates.createTasks", {
                  count: template.items.length,
                })
              : t("workspace:templates.apply")}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
