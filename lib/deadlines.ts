export function parseLocalDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
}

export function daysFromToday(value: string, today = new Date()): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const date = parseLocalDate(value);
  const due = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((due.getTime() - start.getTime()) / 86_400_000);
}

export function isDueWithinDays(value: string, days: number, today = new Date()): boolean {
  const offset = daysFromToday(value, today);
  return offset >= 0 && offset <= days;
}
