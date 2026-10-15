import { ChevronRight, Flame } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AssignedTaskRow } from "@/components/my-work/assigned-task-row";
import {
  DUE_BUCKETS,
  type DueBucket,
  getDueBucket,
} from "@/components/my-work/due-bucket";
import { useStoredState } from "@/hooks/use-stored-state";
import { cn } from "@/lib/cn";
import type { DashboardTask } from "./use-all-assigned-tasks";

// Eden: personal dashboard grouped Space (workspace) → project. Grouping hides
// urgency behind collapsed headers, so overdue, due-today and urgent tasks are
// pulled into a "Focus" block on top, and every header shows its overdue count.

const PRIORITY_RANK: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

type ProjectGroup = {
  id: string;
  name: string;
  tasks: DashboardTask[];
  overdue: number;
  urgency: number;
};

type SpaceGroup = {
  id: string;
  name: string;
  projects: ProjectGroup[];
  total: number;
  overdue: number;
  today: number;
};

function isFocusTask(bucket: DueBucket, priority: string) {
  return bucket === "overdue" || bucket === "today" || priority === "urgent";
}

// Lower is more pressing: due bucket first, then priority.
function urgencyOf(bucket: DueBucket, priority: string) {
  return DUE_BUCKETS.indexOf(bucket) * 10 - (PRIORITY_RANK[priority] ?? 0);
}

function parseCollapsed(raw: unknown): string[] {
  return Array.isArray(raw)
    ? raw.filter((id): id is string => typeof id === "string")
    : [];
}

export function TasksBySpace({
  tasks,
  day,
}: {
  tasks: DashboardTask[];
  day: number;
}) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useStoredState(
    "eden:dashboard-collapsed-spaces",
    parseCollapsed,
    [],
  );

  const { focus, spaces } = useMemo(() => {
    const now = new Date(day);
    const focus: DashboardTask[] = [];
    const bySpace = new Map<string, SpaceGroup>();
    const byProject = new Map<string, ProjectGroup>();

    // Tasks arrive sorted by due date, so groups keep that order inside.
    for (const task of tasks) {
      const bucket = getDueBucket(task.dueDate, now);
      if (isFocusTask(bucket, task.priority)) focus.push(task);

      let space = bySpace.get(task.workspaceId);
      if (!space) {
        space = {
          id: task.workspaceId,
          name: task.workspaceName,
          projects: [],
          total: 0,
          overdue: 0,
          today: 0,
        };
        bySpace.set(task.workspaceId, space);
      }
      let project = byProject.get(task.projectId);
      if (!project) {
        project = {
          id: task.projectId,
          name: task.projectName,
          tasks: [],
          overdue: 0,
          urgency: Number.POSITIVE_INFINITY,
        };
        byProject.set(task.projectId, project);
        space.projects.push(project);
      }

      project.tasks.push(task);
      project.urgency = Math.min(
        project.urgency,
        urgencyOf(bucket, task.priority),
      );
      space.total += 1;
      if (bucket === "overdue") {
        project.overdue += 1;
        space.overdue += 1;
      }
      if (bucket === "today") space.today += 1;
    }

    // Spaces keep the sidebar order so they stay where you expect them;
    // projects inside a space put the most pressing one first.
    for (const space of bySpace.values()) {
      space.projects.sort(
        (a, b) => a.urgency - b.urgency || a.name.localeCompare(b.name),
      );
    }
    focus.sort(
      (a, b) =>
        urgencyOf(getDueBucket(a.dueDate, now), a.priority) -
        urgencyOf(getDueBucket(b.dueDate, now), b.priority),
    );

    return { focus, spaces: [...bySpace.values()] };
  }, [tasks, day]);

  const toggle = (id: string) =>
    setCollapsed((previous) =>
      previous.includes(id)
        ? previous.filter((entry) => entry !== id)
        : [...previous, id],
    );

  return (
    <div className="flex flex-col">
      {focus.length > 0 && (
        <div className="border-destructive/30 border-b bg-destructive/[0.04]">
          <h3 className="flex h-8 items-center gap-2 px-4 font-semibold text-destructive-foreground text-xs">
            <Flame className="size-3.5" aria-hidden="true" />
            {t("workspace:dashboard.focus")}
            <span className="font-normal text-muted-foreground tabular-nums">
              {focus.length}
            </span>
            <span className="ml-auto font-normal text-muted-foreground">
              {t("workspace:dashboard.focusHint")}
            </span>
          </h3>
          <div className="flex flex-col px-3">
            {focus.map((task) => (
              <AssignedTaskRow
                key={task.id}
                task={task}
                workspaceId={task.workspaceId}
                workspaceName={task.workspaceName}
              />
            ))}
          </div>
        </div>
      )}
      {spaces.map((space) => {
        const isCollapsed = collapsed.includes(space.id);
        return (
          <div key={space.id}>
            <button
              type="button"
              onClick={() => toggle(space.id)}
              aria-expanded={!isCollapsed}
              className="flex h-9 w-full items-center gap-2 border-border/60 border-b bg-muted/40 px-4 text-left font-semibold text-foreground text-xs outline-none transition-colors hover:bg-muted/70 focus-visible:bg-muted/70"
            >
              <ChevronRight
                className={cn(
                  "size-3.5 shrink-0 text-muted-foreground transition-transform",
                  !isCollapsed && "rotate-90",
                )}
                aria-hidden="true"
              />
              <span className="truncate">{space.name}</span>
              <span className="font-normal text-muted-foreground tabular-nums">
                {space.total}
              </span>
              <span className="ml-auto flex shrink-0 items-center gap-1.5 font-medium">
                {space.overdue > 0 && (
                  <span className="rounded-full bg-destructive/10 px-1.5 text-destructive-foreground tabular-nums">
                    {t("workspace:dashboard.overdueCount", {
                      count: space.overdue,
                    })}
                  </span>
                )}
                {space.today > 0 && (
                  <span className="rounded-full bg-warning/10 px-1.5 text-warning-foreground tabular-nums">
                    {t("workspace:dashboard.todayCount", {
                      count: space.today,
                    })}
                  </span>
                )}
              </span>
            </button>
            {!isCollapsed &&
              space.projects.map((project) => (
                <div key={project.id}>
                  <h4 className="flex h-7 items-center gap-2 pr-4 pl-10 font-medium text-muted-foreground text-xs">
                    <span className="truncate text-foreground/80">
                      {project.name}
                    </span>
                    <span className="tabular-nums">{project.tasks.length}</span>
                    {project.overdue > 0 && (
                      <span className="ml-auto text-destructive-foreground tabular-nums">
                        {t("workspace:dashboard.overdueCount", {
                          count: project.overdue,
                        })}
                      </span>
                    )}
                  </h4>
                  <div className="flex flex-col pr-3 pl-6">
                    {project.tasks.map((task) => (
                      <AssignedTaskRow
                        key={task.id}
                        task={task}
                        workspaceId={task.workspaceId}
                        hideProject
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}
