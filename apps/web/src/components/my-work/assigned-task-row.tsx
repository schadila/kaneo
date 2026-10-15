import { Link } from "@tanstack/react-router";
import projectIcons from "@/constants/project-icons";
import type { AssignedTask } from "@/fetchers/task/get-assigned-tasks";
import { cn } from "@/lib/cn";
import { getColumnIcon } from "@/lib/column";
import { getStatusDisplayLabel } from "@/lib/i18n/domain";
import { resolveLabelColor } from "@/lib/label-color";
import { getPriorityIcon } from "@/lib/priority";
import { priorityAccentClass } from "@/lib/priority-accent";
import { DueDateBadge } from "./due-date-badge";

type AssignedTaskRowProps = {
  task: AssignedTask;
  workspaceId: string;
  showLabels?: boolean;
  // Shown before the project on cross-workspace lists (personal dashboard).
  workspaceName?: string;
};

export function AssignedTaskRow({
  task,
  workspaceId,
  showLabels = false,
  workspaceName,
}: AssignedTaskRowProps) {
  const ProjectIcon =
    projectIcons[task.projectIcon as keyof typeof projectIcons] ??
    projectIcons.Layout;

  return (
    <Link
      to="/dashboard/workspace/$workspaceId/project/$projectId/task/$taskId"
      params={{ workspaceId, projectId: task.projectId, taskId: task.id }}
      className={cn(
        "relative flex min-h-12 items-center gap-2.5 border-border/50 border-b py-2 pr-1 pl-3 outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/50",
        priorityAccentClass(task.priority),
      )}
    >
      <span className="flex w-4 shrink-0 justify-center [&_svg]:size-3.5">
        {getPriorityIcon(task.priority)}
      </span>
      <span
        className="shrink-0"
        title={getStatusDisplayLabel(task.status, task.statusName ?? undefined)}
      >
        {getColumnIcon(task.status, false, task.statusIcon)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium text-foreground text-sm">
          {task.title}
        </span>
        <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs">
          <span className="flex min-w-0 items-center gap-1 rounded-md bg-muted px-1.5 py-px font-medium text-foreground/90">
            <ProjectIcon
              className="size-3 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="truncate">{task.projectName}</span>
          </span>
          <span className="shrink-0 font-mono">
            {task.number == null
              ? task.projectSlug
              : `${task.projectSlug}-${task.number}`}
          </span>
          {workspaceName && (
            <span className="min-w-0 shrink-[2] truncate">
              · {workspaceName}
            </span>
          )}
        </span>
      </span>
      {showLabels && task.labels.length > 0 && (
        <span className="hidden shrink-0 items-center gap-1 lg:flex">
          {task.labels.slice(0, 2).map((label) => {
            const color = resolveLabelColor(label.color);
            return (
              <span
                key={label.id}
                className="flex h-5 max-w-28 items-center gap-1 rounded-full border px-2 text-xs"
                style={{
                  borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
                }}
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate text-foreground/80">
                  {label.name}
                </span>
              </span>
            );
          })}
        </span>
      )}
      <DueDateBadge dueDate={task.dueDate} className="shrink-0" />
    </Link>
  );
}
