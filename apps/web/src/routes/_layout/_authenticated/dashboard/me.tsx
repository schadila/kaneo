import { createFileRoute } from "@tanstack/react-router";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import Layout from "@/components/common/layout";
import { MyInboxSection } from "@/components/my-dashboard/my-inbox-section";
import { MyRecentPagesSection } from "@/components/my-dashboard/my-recent-pages-section";
import { MyTasksSection } from "@/components/my-dashboard/my-tasks-section";
import PageTitle from "@/components/page-title";
import { AuthContext } from "@/components/providers/auth-provider";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_layout/_authenticated/dashboard/me")({
  component: MyDashboardPage,
});

function MyDashboardPage() {
  const { t } = useTranslation();
  const user = useContext(AuthContext).user;
  const firstName = user?.name?.split(" ")[0];

  return (
    <>
      <PageTitle title={t("workspace:dashboard.title")} />
      <Layout>
        <Layout.Header>
          <div className="flex w-full items-center gap-1">
            <SidebarTrigger className="-ml-1 h-6 w-6" />
            <Separator
              orientation="vertical"
              className="mx-1.5 data-[orientation=vertical]:h-2.5"
            />
            <h1 className="text-card-foreground text-xs">
              {t("workspace:dashboard.title")}
            </h1>
          </div>
        </Layout.Header>
        <Layout.Content>
          <div className="h-full overflow-y-auto">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
              <div>
                <h2 className="font-semibold text-2xl tracking-tight">
                  {firstName
                    ? t("workspace:dashboard.greeting", { name: firstName })
                    : t("workspace:dashboard.title")}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {t("workspace:dashboard.subtitle")}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
                <div className="min-w-0 lg:col-span-3">
                  <MyTasksSection />
                </div>
                <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
                  <MyInboxSection />
                  <MyRecentPagesSection />
                </div>
              </div>
            </div>
          </div>
        </Layout.Content>
      </Layout>
    </>
  );
}
