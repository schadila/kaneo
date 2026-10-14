import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type DashboardSectionProps = {
  icon: LucideIcon;
  title: string;
  count?: number;
  actions?: ReactNode;
  children: ReactNode;
};

export function DashboardSection({
  icon: Icon,
  title,
  count,
  actions,
  children,
}: DashboardSectionProps) {
  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/80 bg-card">
      <header className="flex h-11 items-center gap-2 border-border/60 border-b px-4">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="font-semibold text-sm">{title}</h2>
        {count ? (
          <span className="rounded-full bg-muted px-1.5 font-medium text-muted-foreground text-xs tabular-nums">
            {count}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-1">{actions}</div>
      </header>
      {children}
    </section>
  );
}
