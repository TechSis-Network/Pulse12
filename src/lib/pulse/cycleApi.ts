import type { CycleDraft, GoalDraft, TaskDraft } from '@/types/pulse';
import { base44 } from '@/api/base44Client';
import { addDays, startOfDay } from 'date-fns';
import { toISODate } from './dates';
import { CYCLE_DAYS } from './dates';
import { goalLimit } from './subscription';
import { recalcWeeklyScores } from './scoreApi';

/**
 * Activate a new 12-week cycle.
 * Enforces: single active cycle (prior active cycles are closed),
 * rule-of-3 (goals capped to tier limit), and writes all tasks + initial scores.
 */
export async function activateCycle({ cycle, goals, tasks, tier }: { cycle: CycleDraft; goals: GoalDraft[]; tasks: TaskDraft[]; tier: string }) {
  // 1. Single active cycle — close any currently active cycles.
  const activeCycles = await base44.entities.Cycle.filter({ status: 'active' });
  for (const c of activeCycles) {
    await base44.entities.Cycle.update(c.id, { status: 'completed' });
  }

  const start = startOfDay(new Date());
  const startDate = toISODate(start);
  const endDate = toISODate(addDays(start, CYCLE_DAYS - 1));
  const limit = goalLimit(tier);
  const goalsToCreate = goals.slice(0, limit);

  // 2. Create the cycle (active).
  const created = await base44.entities.Cycle.create({
    title: cycle.title?.trim() || '12-Week Cycle',
    vision: cycle.vision || '',
    brain_dump: cycle.brain_dump || '',
    status: 'active',
    start_date: startDate,
    end_date: endDate,
    goals_count: goalsToCreate.length,
    recovery_active: false,
  });

  // 3. Create goals (rule-of-3 enforced via slice to tier limit).
  const goalIdMap: Record<string, string> = {};
  for (let i = 0; i < goalsToCreate.length; i++) {
    const g = goalsToCreate[i];
    const createdGoal = await base44.entities.Goal.create({
      cycle_id: created.id,
      title: g.title.trim(),
      description: g.description || '',
      success_metric: g.success_metric || '',
      order: i,
    });
    if (g.tempId) goalIdMap[g.tempId] = createdGoal.id;
  }

  // 4. Create tasks.
  if (tasks.length) {
    const payloads = tasks
      .filter((t) => t.title?.trim())
      .map((t) => ({
        cycle_id: created.id,
        goal_id: t.goal_id ? goalIdMap[t.goal_id] || null : null,
        title: t.title.trim(),
        recurrence_type: t.recurrence_type || 'daily',
        weekdays: t.recurrence_type === 'weekly' ? t.weekdays || [] : [],
        target_time: t.target_time || '',
        duration_minutes: t.duration_minutes || null,
        one_time_date: t.recurrence_type === 'one_time' ? t.one_time_date || null : null,
        active: true,
      }));
    if (payloads.length) await base44.entities.Task.bulkCreate(payloads);
  }

  // 5. Compute and store initial weekly scores.
  await recalcWeeklyScores(created.id);

  return created;
}

export async function setRecoveryActive(cycleId: string, value: boolean) {
  return base44.entities.Cycle.update(cycleId, { recovery_active: value });
}