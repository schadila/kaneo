import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import PageTitle from "@/components/page-title";
import { TaskTemplatesSettings } from "@/components/task-templates/task-templates-settings";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/settings/workspace/templates",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();

  return (
    <>
      <PageTitle title={t("workspace:templates.title")} />
      <TaskTemplatesSettings />
    </>
  );
}
