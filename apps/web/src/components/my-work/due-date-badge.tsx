import { differenceInCalendarDays } from "date-fns";
import { Calendar, CalendarClock, CalendarX } from "lucide-react";
import { useLocalDay } from "@/hooks/use-local-day";
import { cn } from "@/lib/cn";
import { DueDateText } from "./due-date-text";

// Eden: DueDateText inside a tinted chip — red when overdue, amber up to two
// days ahead — to match the due chips of the project list view.
export function DueDateBadge({
  dueDate,
  className,
}: {
  dueDate: string | null;
  className?: string;
}) {
  const day = useLocalDay();
  if (!dueDate) return null;

  const days = differenceInCalendarDays(new Date(dueDate), new Date(day));
  const Icon = days < 0 ? CalendarX : days <= 2 ? CalendarClock : Calendar;

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-md px-1.5",
        days < 0
          ? "bg-destructive/10 text-destructive-foreground"
          : days <= 2
            ? "bg-warning/10 text-warning-foreground"
            : "bg-muted/60 text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      <DueDateText dueDate={dueDate} className="text-inherit" />
    </span>
  );
}
