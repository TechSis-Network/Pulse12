import type { WeekScore } from '@/types/pulse';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { SCORE_THRESHOLD } from '@/lib/pulse/score';

export default function ProgressTrend({ scores }: { scores: WeekScore[] }) {
  const data = (scores || []).map((s) => ({
    week: `W${s.week}`,
    weekNum: s.week,
    score: s.score === null ? null : s.score,
    planned: s.planned,
    completed: s.completed,
    status: s.status,
  }));

  const scored = data.filter((d) => d.score !== null);
  const avg = scored.length ? Math.round(scored.reduce((a, d) => a + (d.score ?? 0), 0) / scored.length) : null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Execution score trend</h2>
            <p className="text-xs text-muted-foreground">Weekly completion % across your 12-week cycle</p>
          </div>
        </div>
        {avg !== null && (
          <div className="text-right">
            <p className="text-2xl font-semibold">{avg}%</p>
            <p className="text-xs text-muted-foreground">average</p>
          </div>
        )}
      </div>
      <div className="mt-6 h-64 w-full">
        {scored.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No scores recorded yet this cycle.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <ReferenceLine
                y={SCORE_THRESHOLD}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{ value: 'Target 85%', position: 'insideTopRight', fontSize: 10, fill: '#f59e0b' }}
              />
              <Tooltip
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--popover))',
                  color: 'hsl(var(--popover-foreground))',
                  fontSize: 12,
                }}
                formatter={(value, _n, item) => {
                  const d = item?.payload;
                  if (!d || d.score === null) return ['No planned work', `Week ${d.weekNum}`];
                  return [`${value}% (${d.completed}/${d.planned} done)`, `Week ${d.weekNum}`];
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill="url(#scoreFill)"
                connectNulls
                dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}