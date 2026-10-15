import { CircleCheck } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AssignedTaskRow } from "@/components/my-work/assigned-task-row";
import {
  DUE_BUCKETS,
  type DueBucket,
  getDueBucket,
} from "@/components/my-work/due-bucket";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLocalDay } from "@/hooks/use-local-day";
import { useStoredState } from "@/hooks/use-stored-state";
import { cn } from "@/lib/cn";
import { DashboardSection } from "./dashboard-section";
import { TasksBySpace } from "./tasks-by-space";
import {
  type DashboardTask,
  useAllAssignedTasks,
} from "./use-all-assigned-tasks";

type TaskGrouping = "due" | "space";

function parseGrouping(raw: unknown): TaskGrouping {
  return raw === "space" ? "space" : "due";
}

export function MyTasksSection() {
  const { t } = useTranslation();
  const day = useLocalDay();
  const { tasks, total, isLoading, failedWorkspaces } = useAllAssignedTasks();
  const [grouping, setGrouping] = useStoredState(
    "eden:dashboard-task-grouping",
    parseGrouping,
    "due",
  );

  const groups = useMemo(() => {
    const byBucket = new Map<DueBucket, DashboardTask[]>();
    for (const task of tasks) {
      const bucket = getDueBucket(task.dueDate, new Date(day));
      byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), task]);
    }
    return DUE_BUCKETS.flatMap((bucket) => {
      const list = byBucket.get(bucket);
      return list ? [{ bucket, tasks: list }] : [];
    });
  }, [tasks, day]);

  return (
    <DashboardSection
      icon={CircleCheck}
      title={t("workspace:dashboard.tasks")}
      count={total}
      actions={
        <ToggleGroup
          value={[grouping]}
          onValueChange={(values) => {
            const next = values[0];
            if (next === "due" || next === "space") setGrouping(next);
          }}
          size="sm"
          aria-label={t("workspace:dashboard.groupBy")}
          className="rounded-lg border border-input bg-background p-0.5 dark:bg-input/32"
        >
          <ToggleGroupItem value="due" className="h-6 px-2 text-xs">
            {t("workspace:dashboard.groupByDue")}
          </ToggleGroupItem>
          <ToggleGroupItem value="space" className="h-6 px-2 text-xs">
            {t("workspace:dashboard.groupBySpace")}
          </ToggleGroupItem>
        </ToggleGroup>
      }
    >
      {isLoading ? (
        <div className="flex justify-center p-6">
          <Spinner />
        </div>
      ) : tasks.length === 0 ? (
        <p className="px-4 py-6 text-muted-foreground text-sm">
          {t("workspace:dashboard.noTasks")}
        </p>
      ) : grouping === "space" ? (
        <TasksBySpace tasks={tasks} day={day} />
      ) : (
        <div className="flex flex-col">
          {groups.map((group) => (
            <div key={group.bucket}>
              <h3
                className={cn(
                  "flex h-8 items-center gap-2 bg-muted/40 px-4 font-semibold text-xs",
                  group.bucket === "overdue"
                    ? "text-destructive-foreground"
                    : "text-foreground",
                )}
              >
                {t(`workspace:myWork.due.${group.bucket}`)}
                <span className="font-normal text-muted-foreground tabular-nums">
                  {group.tasks.length}
                </span>
              </h3>
              <div className="flex flex-col px-3">
                {group.tasks.map((task) => (
                  <AssignedTaskRow
                    key={task.id}
                    task={task}
                    workspaceId={task.workspaceId}
                    workspaceName={task.workspaceName}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {failedWorkspaces > 0 && (
        <p className="px-4 py-2 text-destructive-foreground text-xs">
          {t("workspace:dashboard.partialTasks", { count: failedWorkspaces })}
        </p>
      )}
    </DashboardSection>
  );
}
