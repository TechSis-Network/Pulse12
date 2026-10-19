import type { Task, Goal } from '@/types/entities';
import type { LogsMap } from '@/types/pulse';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import EmptyState from './EmptyState';
import { recurrenceLabel, formatTime, formatDuration } from '@/lib/pulse/recurrence';

export default function DailyChecklist({ tasks, goals, logsMap, dateISO, onToggle, dateLabel }: { tasks: Task[]; goals: Goal[]; logsMap: LogsMap; dateISO: string; onToggle: (task: Task) => void; dateLabel: string }) {
  const goalMap: Record<string, Goal> = {};
  for (const g of goals) goalMap[g.id] = g;

  if (!tasks || tasks.length === 0) {
    return (
      <EmptyState
        title="Nothing planned today"
        description="Tasks scheduled for today will appear here as quick-completion checklists."
      />
    );
  }

  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between px-5 py-3">
        <h2 className="text-sm font-semibold">Today's actions</h2>
        <span className="text-xs text-muted-foreground">{dateLabel}</span>
      </div>
      <ul className="px-2 py-1">
        {tasks.map((task) => {
          const done = !!logsMap[`${task.id}_${dateISO}`];
          const goal = task.goal_id ? goalMap[task.goal_id] : null;
          return (
            <li key={task.id}>
              <button
                onClick={() => onToggle(task)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-secondary/60"
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                    done ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'
                  )}
                  aria-hidden
                >
                  {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-sm font-medium', done && 'text-muted-foreground line-through')}>
                    {task.title}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    {goal && <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">{goal.title}</span>}
                    <span>{recurrenceLabel(task)}</span>
                    {task.target_time && <span>· {formatTime(task.target_time)}</span>}
                    {task.duration_minutes && <span>· {formatDuration(task.duration_minutes)}</span>}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}