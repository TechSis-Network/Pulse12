import type { CycleData, LogsMap, ToggleTaskLogInput } from '@/types/pulse';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { todayISO } from './dates';

export function useActiveCycle() {
  return useQuery({
    queryKey: ['activeCycle'],
    queryFn: async () => {
      const cycles = await base44.entities.Cycle.filter({ status: 'active' }, '-created_date', 1);
      return cycles[0] || null;
    },
  });
}

export function useCycleData(cycleId: string | undefined) {
  return useQuery({
    queryKey: ['cycleData', cycleId],
    enabled: !!cycleId,
    queryFn: async () => {
      const [goals, tasks, logs, scores] = await Promise.all([
        base44.entities.Goal.filter({ cycle_id: cycleId }, 'order'),
        base44.entities.Task.filter({ cycle_id: cycleId }, '-created_date'),
        base44.entities.TaskLog.filter({ cycle_id: cycleId }, '-created_date'),
        base44.entities.WeeklyScore.filter({ cycle_id: cycleId }, 'week_number'),
      ]);
      const logsMap: LogsMap = {};
      for (const l of logs) {
        logsMap[`${l.task_id}_${l.date}`] = !!l.completed;
      }
      return { goals, tasks, logs, scores, logsMap };
    },
  });
}

export function useCycle(cycleId: string | undefined) {
  return useQuery({
    queryKey: ['cycle', cycleId],
    enabled: !!cycleId,
    queryFn: async () => base44.entities.Cycle.get(cycleId!),
  });
}

// Idempotent task-log toggle / upsert: one log per task+date.
export function useToggleTaskLog(cycleId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ task, date, completed }: ToggleTaskLogInput) => {
      const existing = await base44.entities.TaskLog.filter({ task_id: task.id, date });
      if (existing.length > 0) {
        return base44.entities.TaskLog.update(existing[0].id, {
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        });
      }
      return base44.entities.TaskLog.create({
        task_id: task.id,
        cycle_id: cycleId!,
        date,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      });
    },
    onMutate: async ({ task, date, completed }: ToggleTaskLogInput) => {
      await qc.cancelQueries({ queryKey: ['cycleData', cycleId] });
      const prev = qc.getQueryData<CycleData>(['cycleData', cycleId]);
      if (prev) {
        const key = `${task.id}_${date}`;
        qc.setQueryData(['cycleData', cycleId], {
          ...prev,
          logsMap: { ...prev.logsMap, [key]: completed },
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['cycleData', cycleId], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['cycleData', cycleId] });
    },
  });
}

export { todayISO };