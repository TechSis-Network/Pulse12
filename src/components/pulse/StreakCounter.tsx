import { Flame, Sparkles } from 'lucide-react';

export default function StreakCounter({ streak }: { streak: number }) {
  if (streak <= 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-5 text-center shadow-sm">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Flame className="h-5 w-5" />
        </div>
        <p className="mt-2 text-sm font-medium">No streak yet</p>
        <p className="text-xs text-muted-foreground">Hit 85% this week to start one.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-400/60 bg-gradient-to-br from-amber-50 to-orange-50 p-5 text-center shadow-sm dark:from-amber-500/10 dark:to-orange-500/10">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-300/30 blur-2xl" />
      <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30">
        <Flame className="h-6 w-6" />
      </div>
      <p className="relative mt-2 text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">{streak}</p>
      <p className="relative text-xs font-semibold uppercase tracking-wider text-amber-600/80 dark:text-amber-400/80">
        {streak === 1 ? 'Week streak!' : `${streak}-week streak`}
      </p>
      {streak === 1 && (
        <p className="relative mt-1 inline-flex items-center gap-1 text-xs text-amber-600/80 dark:text-amber-400/80">
          <Sparkles className="h-3 w-3" /> Streak started — keep it going!
        </p>
      )}
    </div>
  );
}