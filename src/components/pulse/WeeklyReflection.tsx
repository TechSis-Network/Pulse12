import type { Reflection } from '@/types/entities';
import { useEffect, useState } from 'react';
import { NotebookPen, Check, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function WeeklyReflection({ cycleId, week, score }: { cycleId: string; week: number; score: number | null }) {
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [whatWorked, setWhatWorked] = useState('');
  const [whatDidnt, setWhatDidnt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const list = await base44.entities.Reflection.filter({ cycle_id: cycleId, week_number: week });
        if (!active) return;
        const r = list[0] || null;
        setReflection(r);
        setWhatWorked(r?.what_worked || '');
        setWhatDidnt(r?.what_didnt || '');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [cycleId, week]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const payload = {
        cycle_id: cycleId,
        week_number: week,
        what_worked: whatWorked.trim(),
        what_didnt: whatDidnt.trim(),
      };
      if (reflection) {
        const updated = await base44.entities.Reflection.update(reflection.id, payload);
        setReflection(updated);
      } else {
        const created = await base44.entities.Reflection.create(payload);
        setReflection(created);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const hasScore = score != null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <NotebookPen className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Week {week} reflection</h2>
          <p className="text-xs text-muted-foreground">
            {hasScore ? `Your score is ${score}%. Capture what worked and what didn't.` : 'Capture what worked and what didn\'t this week.'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="what-worked">What worked</Label>
            <Textarea
              id="what-worked"
              rows={3}
              placeholder="Wins, momentum, habits that stuck…"
              value={whatWorked}
              onChange={(e) => setWhatWorked(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="what-didnt">What didn't work</Label>
            <Textarea
              id="what-didnt"
              rows={3}
              placeholder="Friction, missed actions, blockers…"
              value={whatDidnt}
              onChange={(e) => setWhatDidnt(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            {saved && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save reflection'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}