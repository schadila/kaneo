import { ListChecks, Plus } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useSaveTaskTemplate from "@/hooks/mutations/task-template/use-save-task-template";
import useGetLabelsByWorkspace from "@/hooks/queries/label/use-get-labels-by-workspace";
import { toast } from "@/lib/toast";
import {
  emptyDraft,
  fromDrafts,
  type ItemDraft,
  moveDraft,
  toDrafts,
} from "./template-draft";
import { TemplateItemRow } from "./template-item-row";
import type { TaskTemplate } from "./template-types";

type TemplateFormProps = {
  template: TaskTemplate | null;
  workspaceId: string;
  onClose: () => void;
};

export function TemplateForm({
  template,
  workspaceId,
  onClose,
}: TemplateFormProps) {
  const { t } = useTranslation();
  const saveTemplate = useSaveTaskTemplate();
  const { data: allLabels = [] } = useGetLabelsByWorkspace(workspaceId);
  const labels = allLabels.filter((label) => !label.taskId);
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [drafts, setDrafts] = useState<ItemDraft[]>(() =>
    template?.items.length ? toDrafts(template.items) : [emptyDraft()],
  );
  const [error, setError] = useState("");
  const nameId = useId();
  const descriptionId = useId();

  const update = (index: number, draft: ItemDraft) =>
    setDrafts((current) =>
      current.map((entry, i) => (i === index ? draft : entry)),
    );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saveTemplate.isPending) return;
    const items = fromDrafts(drafts);
    if (!name.trim()) return setError(t("workspace:templates.nameRequired"));
    if (items.length === 0)
      return setError(t("workspace:templates.itemsRequired"));

    try {
      await saveTemplate.mutateAsync(
        template
          ? { id: template.id, name: name.trim(), description, items }
          : { workspaceId, name: name.trim(), description, items },
      );
      toast.success(t("workspace:templates.saved"), { icon: ListChecks });
      onClose();
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : t("workspace:templates.saveFailed"),
      );
    }
  };

  return (
    <form className="contents" noValidate onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>
          {template
            ? t("workspace:templates.editTemplate")
            : t("workspace:templates.newTemplate")}
        </DialogTitle>
        <DialogDescription>
          {t("workspace:templates.formDescription")}
        </DialogDescription>
      </DialogHeader>
      <DialogPanel className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor={nameId}>{t("workspace:templates.name")}</Label>
          <Input
            id={nameId}
            value={name}
            maxLength={200}
            placeholder={t("workspace:templates.namePlaceholder")}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={descriptionId}>
            {t("workspace:templates.description")}
          </Label>
          <Textarea
            id={descriptionId}
            value={description}
            maxLength={2000}
            rows={2}
            placeholder={t("workspace:templates.descriptionPlaceholder")}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <span className="block font-medium text-sm">
            {t("workspace:templates.tasks")}
          </span>
          <p className="text-muted-foreground text-xs">
            {t("workspace:templates.tasksHint")}
          </p>
          <ul>
            {drafts.map((draft, index) => (
              <TemplateItemRow
                key={draft.key}
                draft={draft}
                index={index}
                count={drafts.length}
                labels={labels}
                onChange={(next) => update(index, next)}
                onMove={(delta) =>
                  setDrafts((current) => moveDraft(current, index, delta))
                }
                onRemove={() =>
                  setDrafts((current) => current.filter((_, i) => i !== index))
                }
              />
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDrafts((current) => [...current, emptyDraft()])}
          >
            <Plus aria-hidden="true" />
            {t("workspace:templates.addItem")}
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-destructive-foreground text-sm">
            {error}
          </p>
        )}
      </DialogPanel>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {t("common:actions.cancel")}
        </Button>
        <Button type="submit" disabled={saveTemplate.isPending}>
          {t("workspace:templates.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
