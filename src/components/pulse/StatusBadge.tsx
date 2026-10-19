import { cn } from '@/lib/utils';

const MAP = {
  green: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', label: 'On Target' },
  amber: { cls: 'bg-amber-50 text-amber-700 ring-amber-600/20', label: 'Below Target' },
  no_planned: { cls: 'bg-slate-100 text-slate-500 ring-slate-400/20', label: 'No Planned Work' },
};

export default function StatusBadge({ status }: { status: import("@/types/pulse").ScoreStatus }) {
  const s = MAP[status] || MAP.no_planned;
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', s.cls)}>
      {s.label}
    </span>
  );
}