import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { getPriorityLabel } from "@/lib/i18n/domain";
import { resolveLabelColor } from "@/lib/label-color";
import { getPriorityIcon } from "@/lib/priority";
import type { ItemDraft } from "./template-draft";
import { TEMPLATE_PRIORITIES } from "./template-types";

type TemplateItemRowProps = {
  draft: ItemDraft;
  index: number;
  count: number;
  labels: Array<{ name: string; color: string }>;
  onChange: (draft: ItemDraft) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
};

export function TemplateItemRow({
  draft,
  index,
  count,
  labels,
  onChange,
  onMove,
  onRemove,
}: TemplateItemRowProps) {
  const { t } = useTranslation();
  const set = (patch: Partial<ItemDraft>) => onChange({ ...draft, ...patch });
  const toggleLabel = (name: string) =>
    set({
      labels: draft.labels.includes(name)
        ? draft.labels.filter((label) => label !== name)
        : [...draft.labels, name],
    });

  return (
    <li className="flex flex-col gap-2 border-border/60 border-b py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        <span className="w-5 shrink-0 text-right text-muted-foreground text-xs tabular-nums">
          {index + 1}.
        </span>
        <Input
          value={draft.title}
          onChange={(event) => set({ title: event.target.value })}
          placeholder={t("workspace:templates.itemTitlePlaceholder")}
          aria-label={t("workspace:templates.itemTitle")}
          className="min-w-40 flex-1"
          maxLength={500}
        />
        <Select
          value={draft.priority}
          onValueChange={(value) => {
            if (typeof value === "string")
              set({ priority: value as ItemDraft["priority"] });
          }}
        >
          <SelectTrigger
            size="sm"
            className="w-44 shrink-0"
            aria-label={t("workspace:templates.priority")}
          >
            <SelectValue>
              <span className="flex items-center gap-1.5">
                {getPriorityIcon(draft.priority)}
                {getPriorityLabel(draft.priority)}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TEMPLATE_PRIORITIES.map((priority) => (
              <SelectItem key={priority} value={priority}>
                <span className="flex items-center gap-1.5">
                  {getPriorityIcon(priority)}
                  {getPriorityLabel(priority)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
          {t("workspace:templates.dueAfter")}
          <Input
            type="number"
            inputMode="numeric"
            value={draft.dueOffset}
            onChange={(event) => set({ dueOffset: event.target.value })}
            placeholder="–"
            className="w-16"
            min={-365}
            max={3650}
          />
          {t("workspace:templates.days")}
        </label>
        <div className="flex shrink-0 items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label={t("workspace:templates.moveItemUp")}
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={index === count - 1}
            onClick={() => onMove(1)}
            aria-label={t("workspace:templates.moveItemDown")}
          >
            <ArrowDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onRemove}
            aria-label={t("workspace:templates.removeItem")}
          >
            <X />
          </Button>
        </div>
      </div>
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-7">
          {labels.map((label) => {
            const active = draft.labels.includes(label.name);
            const color = resolveLabelColor(label.color);
            return (
              <button
                key={label.name}
                type="button"
                aria-pressed={active}
                onClick={() => toggleLabel(label.name)}
                className={cn(
                  "flex h-5 items-center gap-1 rounded-full border px-2 text-xs transition-colors",
                  active
                    ? "text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
                style={
                  active
                    ? {
                        borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
                        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                      }
                    : undefined
                }
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {label.name}
              </button>
            );
          })}
        </div>
      )}
    </li>
  );
}
