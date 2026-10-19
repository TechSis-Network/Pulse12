import type { Cycle, Task } from '@/types/entities';
import type { LogsMap, WeekScore } from '@/types/pulse';
import { addDays, parseISO } from 'date-fns';
import { isPlannedOnDate } from './recurrence';
import { CYCLE_WEEKS } from './dates';

export const SCORE_THRESHOLD = 85; // green at >= 85, amber below

/**
 * Compute the weekly execution score for one week.
 * taskLogs: map keyed `${task_id}_${dateStr}` -> boolean (completed)
 * Rule: completed planned instances / total planned instances * 100.
 * A week with zero planned tasks is "no_planned", never a failing score.
 */
export function computeWeeklyScore({ tasks, weekStart, taskLogs }: { tasks: Task[]; weekStart: Date; taskLogs: LogsMap }): Omit<WeekScore, "week"> {
  let planned = 0;
  let completed = 0;
  for (const task of tasks) {
    if (!task || task.active === false) continue;
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      if (isPlannedOnDate(task, d)) {
        planned++;
        const key = `${task.id}_${dateKey(d)}`;
        if (taskLogs && taskLogs[key]) completed++;
      }
    }
  }
  if (planned === 0) {
    return { planned: 0, completed: 0, score: null, status: 'no_planned' };
  }
  const score = Math.round((completed / planned) * 100);
  return { planned, completed, score, status: score >= SCORE_THRESHOLD ? 'green' : 'amber' };
}

function dateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Compute scores for all 12 weeks of a cycle.
export function computeAllWeekScores(cycle: Cycle | null | undefined, tasks: Task[], logsMap: LogsMap): WeekScore[] {
  if (!cycle?.start_date) return [];
  const start = parseISO(cycle.start_date);
  const results = [];
  for (let w = 1; w <= CYCLE_WEEKS; w++) {
    const ws = addDays(start, (w - 1) * 7);
    const r = computeWeeklyScore({ tasks, weekStart: ws, taskLogs: logsMap });
    results.push({ week: w, ...r });
  }
  return results;
}

// Two consecutive scored weeks below threshold -> recovery needed.
export function needsRecovery(allScores: WeekScore[], currentWeek: number) {
  const scored = allScores.filter(
    (s) => s.week <= currentWeek && s.planned > 0 && s.score !== null
  );
  if (scored.length < 2) return false;
  const lastTwo = scored.slice(-2);
  return lastTwo.every((s) => s.score !== null && s.score < SCORE_THRESHOLD);
}

// Consecutive weeks (from current week backwards) at or above the 85% threshold.
// The in-progress current week only counts if green; an amber current week doesn't break the streak.
export function computeStreak(allScores: WeekScore[], currentWeek: number) {
  let streak = 0;
  for (let w = currentWeek; w >= 1; w--) {
    const s = allScores.find((x) => x.week === w);
    if (!s) break;
    const isCurrent = w === currentWeek;
    if (s.planned === 0 || s.score == null) {
      if (isCurrent) continue;
      break;
    }
    if (s.score >= SCORE_THRESHOLD) {
      streak++;
    } else if (isCurrent) {
      continue;
    } else {
      break;
    }
  }
  return streak;
}