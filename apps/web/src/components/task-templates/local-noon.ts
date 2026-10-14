// "YYYY-MM-DD" from a date input → that day at local noon. Whole-day due-date
// offsets added to noon never cross midnight, even on DST changes.
export function localNoon(dateInput: string): Date {
  const [year, month, day] = dateInput.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12);
}

export function todayInput(now = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
