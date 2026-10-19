import type { Cycle } from '@/types/entities';
import { Link } from 'react-router-dom';
import { formatDateLabel } from '@/lib/pulse/dates';

export default function CycleHeader({ cycle, weekIndex }: { cycle: Cycle; weekIndex: number }) {
  const totalWeeks = 12;
  const pct = Math.min(weekIndex / totalWeeks, 1) * 100;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Active cycle
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{cycle.title}</h1>
        </div>
        <Link
          to={`/cycle/${cycle.id}`}
          className="self-start rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:self-auto"
        >
          View full plan
        </Link>
      </div>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-primary">{weekIndex}</span>
        <span className="text-sm text-muted-foreground">of {totalWeeks} weeks</span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {formatDateLabel(cycle.start_date)} — {formatDateLabel(cycle.end_date)}
      </p>
    </div>
  );
}