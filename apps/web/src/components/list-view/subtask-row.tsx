import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { DueDateBadge } from "@/components/my-work/due-date-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { getColumnIcon } from "@/lib/column";
import { isTaskCompleted } from "@/lib/due-date-status";
import { getInitials } from "@/lib/get-initials";
import { getPriorityIcon } from "@/lib/priority";
import { priorityAccentClass } from "@/lib/priority-accent";
import type { ProjectWithTasks } from "@/types/project";
import type Task from "@/types/task";

type SubtaskRowProps = {
  task: Task;
  projectSlug: string;
  columns: ProjectWithTasks["columns"];
  assignee?: { name?: string | null; image?: string | null };
};

// Compact, non-draggable row for a subtask shown under its parent in the list
// view. Clicking opens the task like a normal row.
export function SubtaskRow({
  task,
  projectSlug,
  columns,
  assignee,
}: SubtaskRowProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const column = columns.find((entry) => entry.id === task.status);
  const completed = isTaskCompleted(
    task.status,
    columns.map((entry) => ({ slug: entry.id, isFinal: entry.isFinal })),
  );

  return (
    <button
      type="button"
      onClick={() => navigate({ to: ".", search: { taskId: task.id } })}
      className={cn(
        "relative flex w-full items-center gap-3 border-border/40 border-t py-2 pr-4 pl-12 text-left outline-none transition-colors hover:bg-accent/60 focus-visible:bg-accent/60",
        !completed && priorityAccentClass(task.priority),
      )}
    >
      <span
        className="flex shrink-0 [&_svg]:size-3.5"
        title={column?.name ?? task.status}
      >
        {getColumnIcon(task.status, column?.isFinal ?? false, column?.icon)}
      </span>
      <span className="shrink-0 font-mono text-muted-foreground text-xs">
        {projectSlug}-{task.number}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          completed ? "text-muted-foreground line-through" : "text-foreground",
        )}
      >
        {task.title}
      </span>
      <span className="flex w-4 shrink-0 justify-center [&_svg]:size-3.5">
        {getPriorityIcon(task.priority ?? "")}
      </span>
      {!completed && <DueDateBadge dueDate={task.dueDate ?? null} />}
      {task.userId ? (
        <Avatar className="size-5 shrink-0">
          <AvatarImage src={assignee?.image ?? ""} alt={assignee?.name ?? ""} />
          <AvatarFallback className="text-[10px]">
            {getInitials(assignee?.name ?? undefined)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] text-muted-foreground"
          title={t("tasks:assignee.unassigned")}
        >
          ?
        </span>
      )}
    </button>
  );
}
