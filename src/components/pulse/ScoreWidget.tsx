import type { WeekScore } from '@/types/pulse';
import { Trophy } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { SCORE_THRESHOLD } from '@/lib/pulse/score';

const STATUS_COLOR = {
  green: 'text-emerald-600',
  amber: 'text-amber-600',
  no_planned: 'text-muted-foreground',
};

const BAR_COLOR = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  no_planned: 'bg-muted-foreground/30',
};

export default function ScoreWidget({ week, score, status, planned, completed }: WeekScore) {
  const pct = score ?? 0;
  const barPct = planned > 0 ? Math.min((completed / planned) * 100, 100) : 0;
  const benchmarkLeft = `${SCORE_THRESHOLD}%`;
  const perfect = pct === 100 && planned > 0;

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-colors ${perfect ? 'border-emerald-400 shadow-emerald-500/20' : 'border-border'}`}>
      {perfect && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Week {week} execution
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-4xl font-semibold tracking-tight ${STATUS_COLOR[status]}`}>
              {score === null ? '—' : `${pct}%`}
            </span>
          </div>
        </div>
        {perfect ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow">
            <Trophy className="h-3.5 w-3.5" /> Perfect Week!
          </span>
        ) : (
          <StatusBadge status={status} />
        )}
      </div>

      <div className="mt-5">
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${BAR_COLOR[status]}`}
            style={{ width: `${barPct}%` }}
          />
          <div
            className="absolute top-0 h-full w-px bg-foreground/40"
            style={{ left: benchmarkLeft }}
            title="85% benchmark"
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{planned === 0 ? 'No tasks planned this week' : `${completed} of ${planned} planned tasks done`}</span>
          <span>Target {SCORE_THRESHOLD}%</span>
        </div>
      </div>
    </div>
  );
}