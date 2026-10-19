import type { WeekScore } from '@/types/pulse';
import { BarChart, Bar, XAxis, YAxis, ReferenceLine, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SCORE_THRESHOLD } from '@/lib/pulse/score';

const BAR_FILL = { green: '#10b981', amber: '#f59e0b', no_planned: '#cbd5e1' };

export default function ScoreTrend({ scores }: { scores: WeekScore[] }) {
  const data = (scores || []).map((s) => ({
    week: `W${s.week}`,
    score: s.score === null ? 0 : s.score,
    status: s.status,
    planned: s.planned,
  }));

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No score history yet.</p>;
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
          <ReferenceLine y={SCORE_THRESHOLD} stroke="#71717a" strokeDasharray="4 4" />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
            contentStyle={{ borderRadius: 12, border: '1px solid #e7e5e4', fontSize: 12 }}
            formatter={(value, _name, item) => {
              const d = item?.payload;
              if (!d || d.planned === 0) return ['No planned work', 'Week'];
              return [`${value}% (${d.planned} planned)`, `Week ${d.week}`];
            }}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={36}>
            {data.map((d, i) => (
              <Cell key={i} fill={BAR_FILL[d.status] || BAR_FILL.no_planned} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}