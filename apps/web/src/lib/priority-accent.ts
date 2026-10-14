// Eden: a thin colored bar on the left edge of task rows, so priority reads at
// a glance in list views. The row needs `relative`.
const ACCENT_BASE =
  "before:pointer-events-none before:absolute before:inset-y-1.5 before:left-0.5 before:w-[3px] before:rounded-full";

const ACCENT_COLOR: Record<string, string> = {
  urgent: "before:bg-destructive",
  high: "before:bg-warning",
  medium: "before:bg-warning/45",
  low: "before:bg-info/50",
};

export function priorityAccentClass(priority: string | null | undefined) {
  const color = priority ? ACCENT_COLOR[priority] : undefined;
  return color ? `${ACCENT_BASE} ${color}` : "";
}
