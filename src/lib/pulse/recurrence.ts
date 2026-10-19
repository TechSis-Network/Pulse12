import type { Task } from '@/types/entities';
import { format, addDays } from 'date-fns';

// Whether a task is planned on a given Date.
export function isPlannedOnDate(task: Task, date: Date) {
  if (!task || task.active === false) return false;
  const dow = date.getDay(); // 0 Sun - 6 Sat
  switch (task.recurrence_type) {
    case 'daily':
      return true;
    case 'weekly':
      return Array.isArray(task.weekdays) && task.weekdays.length > 0 && task.weekdays.includes(dow);
    case 'one_time':
      return !!task.one_time_date && task.one_time_date === format(date, 'yyyy-MM-dd');
    default:
      return false;
  }
}

// Count of planned instances of a task within a 7-day week starting at weekStart.
export function plannedInstancesInWeek(task: Task, weekStart: Date) {
  let count = 0;
  for (let i = 0; i < 7; i++) {
    if (isPlannedOnDate(task, addDays(weekStart, i))) count++;
  }
  return count;
}

// Tasks planned for a given date (e.g. today), in original order.
export function tasksPlannedOnDate(tasks: Task[] | undefined, date: Date) {
  return (tasks || []).filter((t) => isPlannedOnDate(t, date));
}

export function recurrenceLabel(task: Task) {
  switch (task.recurrence_type) {
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'one_time':
      return 'One-time';
    default:
      return '';
  }
}

export function formatTime(timeStr: string | null | undefined) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatDuration(minutes: number | null | undefined) {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}