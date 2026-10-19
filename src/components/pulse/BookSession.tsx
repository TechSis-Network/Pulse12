import type { AccountabilityPartner } from '@/types/entities';
import { asError } from '@/lib/errors';
import { useState } from 'react';
import { Calendar, Video, ExternalLink, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function defaultDate() {
  return new Date().toISOString().slice(0, 10);
}
function defaultTime() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d.toTimeString().slice(0, 5);
}

export default function BookSession({ partner }: { partner: AccountabilityPartner }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(defaultDate());
  const [time, setTime] = useState(defaultTime());
  const [duration, setDuration] = useState<number | string>(30);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ meet_link?: string; html_link?: string; date: string; time: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const book = async () => {
    setError(null);
    setResult(null);
    const start = new Date(`${date}T${time}`).toISOString();
    setCreating(true);
    try {
      const res = await base44.functions.invoke('createAccountabilityEvent', {
        start,
        duration_minutes: Number(duration) || 30,
        title: `Accountability check-in with ${partner.name}`,
        partner_email: partner.email,
        partner_name: partner.name,
        notes: partner.notes,
      });
      setResult({ ...res.data, date, time });
      setOpen(false);
    } catch (caughtError) {
    const e = asError(caughtError);
      setError(e?.message || 'Could not schedule the meeting. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mt-5 border-t border-border pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Book a session</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a date and time. A Google Meet is created and emailed to both you and {partner.name || 'your partner'}.
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen((o) => !o)}>
          <Calendar className="mr-1.5 h-4 w-4" /> Book a session
        </Button>
      </div>

      {open && (
        <div className="mt-4 grid gap-3 sm:grid-cols-4 sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="bk-date">Date</Label>
            <Input id="bk-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bk-time">Time</Label>
            <Input id="bk-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bk-dur">Duration (min)</Label>
            <Input id="bk-dur" type="number" min={15} step={15} value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <Button onClick={book} disabled={creating || !date || !time}>
            {creating ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Scheduling…</> : 'Schedule & invite'}
          </Button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {result && (result.meet_link || result.html_link) && (
        <div className="mt-4 rounded-xl border border-chart-2/30 bg-chart-2/10 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-chart-2/20 text-chart-2">
              <Check className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Session scheduled</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(`${result.date}T${result.time}`), 'EEEE, MMM d · h:mm a')} — Google Meet created and invites sent to both of you.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.meet_link && (
                  <Button asChild size="sm">
                    <a href={result.meet_link} target="_blank" rel="noreferrer"><Video className="mr-1.5 h-4 w-4" /> Join Google Meet</a>
                  </Button>
                )}
                {result.html_link && (
                  <Button asChild size="sm" variant="outline">
                    <a href={result.html_link} target="_blank" rel="noreferrer"><ExternalLink className="mr-1.5 h-4 w-4" /> Open in Calendar</a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}