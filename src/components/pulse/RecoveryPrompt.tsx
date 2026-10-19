import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  { title: 'Simplify', body: 'Cut or pause the lowest-impact tasks. Keep only what moves your core goals.' },
  { title: 'Reschedule', body: 'Move misaligned tasks to better days and times. Protect your focus blocks.' },
  { title: 'Recommit', body: 'Reset expectations, pick the next two weeks, and commit to the plan.' },
];

export default function RecoveryPrompt({ week, onRecommit, recommitting }: { week: number; onRecommit: () => void; recommitting: boolean }) {
  return (
    <div className="rounded-2xl border border-amber-300/60 bg-amber-50/60 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-amber-900">Execution Recovery</h2>
          <p className="mt-1 text-sm text-amber-800/90">
            Your execution has stayed below the 85% benchmark for two consecutive scored weeks.
            Take a moment to reset — this is a target, not a verdict.
          </p>
        </div>
      </div>

      <ol className="mt-5 space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200/70 text-xs font-semibold text-amber-900">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-medium text-amber-900">{s.title}</p>
              <p className="text-sm text-amber-800/80">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5">
        <Button onClick={onRecommit} disabled={recommitting} variant="default" size="sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${recommitting ? 'animate-spin' : ''}`} />
          {recommitting ? 'Recommitting…' : 'I’m recommitting'}
        </Button>
      </div>
    </div>
  );
}