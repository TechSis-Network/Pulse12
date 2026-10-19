import type { WeeklyScore } from '@/types/entities';
import { base44 } from '@/api/base44Client';
import { computeWeeklyScore } from './score';
import { weekStartDate } from './dates';
import { CYCLE_WEEKS } from './dates';

// Recalculate and upsert all 12 weekly score records for a cycle.
export async function recalcWeeklyScores(cycleId: string) {
  const cycle = await base44.entities.Cycle.get(cycleId);
  const [tasks, logs, existing] = await Promise.all([
    base44.entities.Task.filter({ cycle_id: cycleId }),
    base44.entities.TaskLog.filter({ cycle_id: cycleId }),
    base44.entities.WeeklyScore.filter({ cycle_id: cycleId }, 'week_number'),
  ]);

  const logsMap: Record<string, boolean> = {};
  for (const l of logs) logsMap[`${l.task_id}_${l.date}`] = !!l.completed;
  const existingByWeek: Record<number, WeeklyScore> = {};
  for (const s of existing) existingByWeek[s.week_number] = s;

  const results = [];
  for (let w = 1; w <= CYCLE_WEEKS; w++) {
    const ws = weekStartDate(cycle.start_date, w);
    const { planned, completed, score, status } = computeWeeklyScore({
      tasks,
      weekStart: ws,
      taskLogs: logsMap,
    });
    const payload = {
      cycle_id: cycleId,
      week_number: w,
      planned_count: planned,
      completed_count: completed,
      score: score === null ? 0 : score,
      status,
      calculated_at: new Date().toISOString(),
    };
    let record;
    if (existingByWeek[w]) {
      record = await base44.entities.WeeklyScore.update(existingByWeek[w].id, payload);
    } else {
      record = await base44.entities.WeeklyScore.create(payload);
    }
    results.push(record);
  }
  return results;
}