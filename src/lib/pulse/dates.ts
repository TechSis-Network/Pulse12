import { format, parseISO, differenceInCalendarDays, addDays, startOfDay } from 'date-fns';

export const CYCLE_WEEKS = 12;
export const CYCLE_DAYS = 84; // 12 * 7

export function todayISO() {
  return format(startOfDay(new Date()), 'yyyy-MM-dd');
}

export function toISODate(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

export function parseDate(str: string) {
  return parseISO(str);
}

// Returns the current week number (1-12) for a cycle, or 0 if not started, capped at 12.
export function cycleWeekIndex(startDateStr: string | null | undefined, refDate = new Date()) {
  if (!startDateStr) return 0;
  const start = startOfDay(parseISO(startDateStr));
  const ref = startOfDay(refDate);
  const diff = differenceInCalendarDays(ref, start);
  if (diff < 0) return 0;
  const week = Math.floor(diff / 7) + 1;
  return Math.min(Math.max(week, 1), CYCLE_WEEKS);
}

export function weekStartDate(startDateStr: string, weekNumber: number) {
  const start = startOfDay(parseISO(startDateStr));
  return addDays(start, (weekNumber - 1) * 7);
}

export function cycleEndDate(startDateStr: string) {
  return addDays(startOfDay(parseISO(startDateStr)), CYCLE_DAYS - 1);
}

export function formatDateLabel(str: string | null | undefined) {
  if (!str) return '';
  try {
    return format(parseISO(str), 'MMM d, yyyy');
  } catch {
    return str;
  }
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];