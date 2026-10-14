const DAY_MS = 24 * 60 * 60 * 1000;

// Due date of a template item: start + offset whole days. Start is expected at
// local noon, so adding 24h steps stays on the intended calendar day even
// across daylight-saving changes.
export function templateDueDate(
  start: Date,
  dueOffsetDays: number | null,
): Date | undefined {
  if (dueOffsetDays === null) return undefined;
  return new Date(start.getTime() + dueOffsetDays * DAY_MS);
}
