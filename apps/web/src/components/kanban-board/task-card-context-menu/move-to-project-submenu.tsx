import { FolderInput } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import icons from "@/constants/project-icons";
import { useMoveTask } from "@/hooks/mutations/task/use-move-task";
import useGetProjects from "@/hooks/queries/project/use-get-projects";
import type Task from "@/types/task";

type MoveToProjectSubmenuProps = {
  task: Task;
  workspaceId: string;
};

// Eden: "Move to project" straight from the card's context menu (Kaneo only
// offers it in the task panel). The API keeps the task's column when the
// destination has one with the same slug, otherwise uses the first column.
export function MoveToProjectSubmenu({
  task,
  workspaceId,
}: MoveToProjectSubmenuProps) {
  const { t } = useTranslation();
  const { data: projects = [] } = useGetProjects({ workspaceId });
  const { mutate: moveTask } = useMoveTask();
  const destinations = projects.filter(
    (project) => project.id !== task.projectId,
  );

  if (destinations.length === 0) return null;

  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger>
        <span>{t("tasks:move.title")}</span>
      </ContextMenuSubTrigger>
      <ContextMenuSubContent className="max-h-80 w-56 overflow-y-auto">
        {destinations.map((project) => {
          const ProjectIcon =
            icons[project.icon as keyof typeof icons] || FolderInput;
          return (
            <ContextMenuItem
              key={project.id}
              onClick={() =>
                moveTask({
                  taskId: task.id,
                  destinationProjectId: project.id,
                })
              }
              className="[&_svg]:text-muted-foreground"
            >
              <ProjectIcon />
              <span className="truncate">{project.name}</span>
            </ContextMenuItem>
          );
        })}
      </ContextMenuSubContent>
    </ContextMenuSub>
  );
}
