import { useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
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
import { useSubtaskTree } from "./subtask-tree-context";

type Member = {
  userId: string;
  user?: { name?: string | null; image?: string | null };
};

type SubtaskRowProps = {
  task: Task;
  projectSlug: string;
  columns: ProjectWithTasks["columns"];
  members?: Member[];
  // 1 = direct subtask of a list row; deeper levels indent further.
  depth?: number;
};

// Compact, non-draggable row for a subtask shown under its parent in the list
// view. Clicking opens the task like a normal row; its own subtasks fold out
// below it behind a chevron, recursively.
export function SubtaskRow({
  task,
  projectSlug,
  columns,
  members,
  depth = 1,
}: SubtaskRowProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const subtaskTree = useSubtaskTree();
  const subtasks = subtaskTree.childrenOf(task.id);
  const open = subtasks.length > 0 && subtaskTree.isOpen(task.id);
  const assignee = members?.find(
    (member) => member.userId === task.userId,
  )?.user;
  const indent = 48 + (depth - 1) * 20;
  const column = columns.find((entry) => entry.id === task.status);
  const completed = isTaskCompleted(
    task.status,
    columns.map((entry) => ({ slug: entry.id, isFinal: entry.isFinal })),
  );

  return (
    <>
      <div className="relative">
        {subtasks.length > 0 && (
          <button
            type="button"
            aria-expanded={open}
            aria-label={t(
              open ? "tasks:subtasks.collapse" : "tasks:subtasks.expand",
              {
                defaultValue: open ? "Hide subtasks" : "Show subtasks",
              },
            )}
            onClick={() => subtaskTree.toggle(task.id)}
            style={{ left: indent - 26 }}
            className="absolute top-1/2 z-10 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ChevronRight
              className={cn(
                "size-3.5 transition-transform",
                open && "rotate-90",
              )}
            />
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate({ to: ".", search: { taskId: task.id } })}
          style={{ paddingLeft: indent }}
          className={cn(
            "relative flex w-full items-center gap-3 border-border/40 border-t py-2 pr-4 text-left outline-none transition-colors hover:bg-accent/60 focus-visible:bg-accent/60",
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
              completed
                ? "text-muted-foreground line-through"
                : "text-foreground",
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
              <AvatarImage
                src={assignee?.image ?? ""}
                alt={assignee?.name ?? ""}
              />
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
      </div>
      {open &&
        subtasks.map((subtask) => (
          <SubtaskRow
            key={subtask.id}
            task={subtask}
            projectSlug={projectSlug}
            columns={columns}
            members={members}
            depth={depth + 1}
          />
        ))}
    </>
  );
}
