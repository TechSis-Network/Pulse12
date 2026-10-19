import type { Task } from '@/types/entities';
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle, Clock, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCycle, useCycleData } from '@/lib/pulse/queries';
import { recalcWeeklyScores } from '@/lib/pulse/scoreApi';
import { cycleWeekIndex, formatDateLabel } from '@/lib/pulse/dates';
import { computeAllWeekScores } from '@/lib/pulse/score';
import { recurrenceLabel, formatTime, formatDuration } from '@/lib/pulse/recurrence';
import { useQueryClient } from '@tanstack/react-query';
import EmptyState from '@/components/pulse/EmptyState';
import StatusBadge from '@/components/pulse/StatusBadge';
import ScoreTrend from '@/components/pulse/ScoreTrend';

export default function CycleDetail() {
  const { id } = useParams();
  const { data: cycle, isLoading: cycleLoading, isError: cycleError } = useCycle(id);
  const { data, isLoading, isError } = useCycleData(id);
  const qc = useQueryClient();
  const [recalcing, setRecalcing] = useState(false);

  const loading = cycleLoading || isLoading;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-primary" />
      </div>
    );
  }
  if (cycleError || isError || !cycle) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Cycle not found"
        description="This cycle may have been removed or you don’t have access to it."
        action={<Button asChild><Link to="/">Back to dashboard</Link></Button>}
      />
    );
  }

  const weekIndex = cycleWeekIndex(cycle.start_date);
  const scores = computeAllWeekScores(cycle, data!.tasks, data!.logsMap);

  const handleRecalc = async () => {
    setRecalcing(true);
    try {
      await recalcWeeklyScores(id!);
      await qc.invalidateQueries({ queryKey: ['cycleData', id] });
    } finally {
      setRecalcing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Dashboard
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{cycle.title}</h1>
              <StatusBadge status={cycle.status === 'active' ? 'green' : 'no_planned'} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Week {weekIndex} of 12 · {formatDateLabel(cycle.start_date)} — {formatDateLabel(cycle.end_date)}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRecalc} disabled={recalcing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${recalcing ? 'animate-spin' : ''}`} />
            Recalculate scores
          </Button>
        </div>
        {cycle.vision && (
          <div className="mt-5 rounded-xl bg-secondary/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vision</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{cycle.vision}</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Score history</h2>
        <div className="mt-4"><ScoreTrend scores={scores.slice(0, Math.max(weekIndex, 1))} /></div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Week</th>
                <th className="py-2 pr-4 font-medium">Planned</th>
                <th className="py-2 pr-4 font-medium">Completed</th>
                <th className="py-2 pr-4 font-medium">Score</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {scores.slice(0, weekIndex).map((s) => (
                <tr key={s.week} className="border-b border-border/60">
                  <td className="py-2 pr-4">{s.week}</td>
                  <td className="py-2 pr-4">{s.planned}</td>
                  <td className="py-2 pr-4">{s.completed}</td>
                  <td className="py-2 pr-4">{s.score === null ? '—' : `${s.score}%`}</td>
                  <td className="py-2"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Goals & actions</h2>
        {data!.goals.length === 0 && data!.tasks.length === 0 ? (
          <EmptyState title="No goals or actions" description="This cycle has no goals or tasks yet." />
        ) : (
          data!.goals.map((g, i) => {
            const goalTasks = data!.tasks.filter((t) => t.goal_id === g.id);
            return (
              <div key={g.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                  <div>
                    <h3 className="font-medium">{g.title}</h3>
                    {g.success_metric && <p className="text-sm text-muted-foreground">{g.success_metric}</p>}
                  </div>
                </div>
                {goalTasks.length > 0 && (
                  <ul className="mt-4 space-y-2 border-t border-border pt-4">
                    {goalTasks.map((t) => <TaskRow key={t.id} task={t} />)}
                  </ul>
                )}
              </div>
            );
          })
        )}
        {(() => {
          const unassigned = data!.tasks.filter((t) => !t.goal_id);
          if (unassigned.length === 0) return null;
          return (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground">Unassigned actions</h3>
              <ul className="mt-3 space-y-2">
                {unassigned.map((t) => <TaskRow key={t.id} task={t} />)}
              </ul>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="font-medium">{task.title}</span>
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Repeat className="h-3 w-3" />{recurrenceLabel(task)}</span>
        {task.target_time && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(task.target_time)}</span>}
        {task.duration_minutes && <span>{formatDuration(task.duration_minutes)}</span>}
      </span>
    </li>
  );
}
