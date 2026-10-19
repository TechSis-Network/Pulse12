import type { Goal } from '@/types/entities';
import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function GoalBadges({ goals }: { goals: Goal[] }) {
  const [nudgeMap, setNudgeMap] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const m: Record<string, boolean> = {};
    goals?.forEach((g) => { m[g.id] = !!g.nudge_enabled; });
    setNudgeMap(m);
  }, [goals]);

  if (!goals || goals.length === 0) return null;

  const toggle = async (g: Goal) => {
    const next = !nudgeMap[g.id];
    setNudgeMap((p) => ({ ...p, [g.id]: next }));
    setBusy((p) => ({ ...p, [g.id]: true }));
    try {
      await base44.entities.Goal.update(g.id, { nudge_enabled: next });
    } catch {
      setNudgeMap((p) => ({ ...p, [g.id]: !next }));
    } finally {
      setBusy((p) => ({ ...p, [g.id]: false }));
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Goals</h2>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Bell className="h-3 w-3" /> Daily nudge
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {goals.map((g, i) => (
          <li key={g.id} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{g.title}</p>
              {g.success_metric && (
                <p className="truncate text-xs text-muted-foreground">{g.success_metric}</p>
              )}
            </div>
            <button
              onClick={() => toggle(g)}
              disabled={busy[g.id]}
              title={nudgeMap[g.id] ? 'Nudge on' : 'Nudge off'}
              className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-50 ${
                nudgeMap[g.id]
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {nudgeMap[g.id] ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}