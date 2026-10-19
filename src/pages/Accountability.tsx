import type { AccountabilityPartner, SyncLog } from '@/types/entities';
import { useState, useEffect } from 'react';
import { Users, Calendar, Plus, Pencil, Trash2, Check, FileText, Folder, AlertTriangle } from 'lucide-react';

const DRIVE_CONNECTOR_ID = '6aa1f79ddd5e1d282a8db13a';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WEEKDAY_LABELS } from '@/lib/pulse/dates';
import EmptyState from '@/components/pulse/EmptyState';
import BookSession from '@/components/pulse/BookSession';

export default function Accountability() {
  const [partner, setPartner] = useState<AccountabilityPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', weekday: '', notes: '' });
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [showSyncForm, setShowSyncForm] = useState(false);
  const [syncForm, setSyncForm] = useState({ date: '', summary: '', wins: '', blockers: '', commitments: '' });
  const [savingSync, setSavingSync] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [archiveResult, setArchiveResult] = useState<{ doc_url?: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.AccountabilityPartner.list();
      const p = list[0] || null;
      setPartner(p);
      if (p) {
        const logs = await base44.entities.SyncLog.list('-date', 20);
        setSyncLogs(logs);
      } else {
        setSyncLogs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); checkDrive(); }, []);

  const checkDrive = async () => {
    try {
      const res = await base44.functions.invoke('archiveSyncLogToDrive', {});
      setDriveConnected(!!res.data?.connected);
    } catch {
      setDriveConnected(false);
    }
  };

  const connectDrive = async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      const url = await base44.connectors.connectAppUser(DRIVE_CONNECTOR_ID);
      const popup = window.open(url, '_blank');
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          checkDrive();
          setConnecting(false);
        }
      }, 500);
    } catch {
      setConnectError('Could not start Google Drive authorization. Please try again.');
      setConnecting(false);
    }
  };

  const disconnectDrive = async () => {
    await base44.connectors.disconnectAppUser(DRIVE_CONNECTOR_ID);
    setDriveConnected(false);
    setArchiveResult(null);
  };

  const startAdd = () => {
    setForm({ name: '', email: '', weekday: '', notes: '' });
    setEditing(true);
  };
  const startEdit = () => {
    if (!partner) return;
    setForm({
      name: partner.name || '',
      email: partner.email || '',
      weekday: partner.weekday == null ? '' : String(partner.weekday),
      notes: partner.notes || '',
    });
    setEditing(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        weekday: form.weekday === '' ? null : Number(form.weekday),
        notes: form.notes.trim(),
      };
      if (partner) {
        await base44.entities.AccountabilityPartner.update(partner!.id, payload);
      } else {
        await base44.entities.AccountabilityPartner.create(payload);
      }
      setEditing(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    await base44.entities.AccountabilityPartner.delete(partner!.id);
    setPartner(null);
    setEditing(false);
  };

  const addSync = async () => {
    if (!syncForm.date) return;
    setSavingSync(true);
    setArchiveResult(null);
    try {
      const payload = {
        date: syncForm.date,
        summary: syncForm.summary.trim(),
        wins: syncForm.wins.trim(),
        blockers: syncForm.blockers.trim(),
        commitments: syncForm.commitments.trim(),
      };
      await base44.entities.SyncLog.create({ partner_id: partner?.id || null, ...payload });
      setSyncForm({ date: '', summary: '', wins: '', blockers: '', commitments: '' });
      setShowSyncForm(false);
      const logs = await base44.entities.SyncLog.list('-date', 20);
      setSyncLogs(logs);

      if (driveConnected) {
        setArchiving(true);
        try {
          const res = await base44.functions.invoke('archiveSyncLogToDrive', payload);
          setArchiveResult(res.data);
        } catch {
          setArchiveResult(null);
        } finally {
          setArchiving(false);
        }
      }
    } finally {
      setSavingSync(false);
    }
  };

  const deleteSync = async (id: string) => {
    await base44.entities.SyncLog.delete(id);
    setSyncLogs((prev) => prev.filter((l) => l.id !== id));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Accountability &amp; review portal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your accountability partner, book review sessions on Google Calendar, and log notes from your weekly syncs.
        </p>
      </div>

      {!partner && !editing && (
        <EmptyState
          icon={Users}
          title="No accountability partner yet"
          description="Add your mentor or accountability partner to schedule accountability sessions on Google Calendar."
          action={<Button onClick={startAdd}><Plus className="mr-2 h-4 w-4" /> Add partner</Button>}
        />
      )}

      {partner && !editing && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">{partner.name}</h2>
                {partner.email && <p className="text-sm text-muted-foreground">{partner.email}</p>}
                {partner.weekday != null && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    Weekly accountability day: <span className="font-medium">{WEEKDAY_LABELS[partner.weekday]}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={startEdit}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
              <Button variant="ghost" size="sm" onClick={remove} className="text-destructive hover:text-destructive"><Trash2 className="mr-1 h-3.5 w-3.5" /> Remove</Button>
            </div>
          </div>

          {partner.notes && (
            <p className="mt-4 whitespace-pre-wrap rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">{partner.notes}</p>
          )}

          <BookSession partner={partner} />
        </div>
      )}

      {partner && !editing && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Weekly sync log</h2>
                <p className="text-sm text-muted-foreground">Capture notes, wins, blockers, and commitments from your review sessions.</p>
              </div>
            </div>
            {!showSyncForm && (
              <Button size="sm" variant="outline" onClick={() => setShowSyncForm(true)}><Plus className="mr-1.5 h-4 w-4" /> Log a sync</Button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary/50 p-3 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {driveConnected ? (
                <span className="text-muted-foreground">Google Drive connected — sync logs auto-save as Docs.</span>
              ) : (
                <span className="text-muted-foreground">Connect Google Drive to auto-archive each sync log as a Google Doc.</span>
              )}
            </div>
            {driveConnected ? (
              <button onClick={disconnectDrive} className="text-xs text-muted-foreground underline-offset-4 hover:underline">Disconnect</button>
            ) : (
              <Button size="sm" variant="outline" onClick={connectDrive} disabled={connecting}>
                <Folder className="mr-1.5 h-4 w-4" /> {connecting ? 'Connecting…' : 'Connect Google Drive'}
              </Button>
            )}
          </div>

          {connectError && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{connectError} If Google shows an "Access blocked" error, make sure the redirect URI for the <strong>Google Drive (Sync Logs)</strong> OAuth client is added in your Google Cloud Console.</span>
            </div>
          )}

          {archiveResult && archiveResult.doc_url && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-chart-2/10 p-3 text-sm">
              <Check className="h-4 w-4 text-chart-2" />
              <span>Saved to Google Docs.</span>
              <a href={archiveResult.doc_url} target="_blank" rel="noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">Open Doc</a>
            </div>
          )}
          {archiving && (
            <p className="mt-3 text-sm text-muted-foreground">Archiving sync log to Google Docs…</p>
          )}

          {showSyncForm && (
            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="syncdate">Session date</Label>
                <Input id="syncdate" type="date" value={syncForm.date} onChange={(e) => setSyncForm({ ...syncForm, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="syncsummary">Summary</Label>
                <Textarea id="syncsummary" rows={2} placeholder="What did you cover?" value={syncForm.summary} onChange={(e) => setSyncForm({ ...syncForm, summary: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="syncwins">Wins</Label>
                  <Textarea id="syncwins" rows={2} value={syncForm.wins} onChange={(e) => setSyncForm({ ...syncForm, wins: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="syncblockers">Blockers</Label>
                  <Textarea id="syncblockers" rows={2} value={syncForm.blockers} onChange={(e) => setSyncForm({ ...syncForm, blockers: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="synccommit">Commitments for next sync</Label>
                <Textarea id="synccommit" rows={2} placeholder="What you committed to before next sync" value={syncForm.commitments} onChange={(e) => setSyncForm({ ...syncForm, commitments: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowSyncForm(false)} disabled={savingSync}>Cancel</Button>
                <Button onClick={addSync} disabled={savingSync || !syncForm.date}>{savingSync ? 'Saving…' : 'Save sync log'}</Button>
              </div>
            </div>
          )}

          {!showSyncForm && syncLogs.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">No syncs logged yet. Log your first weekly review.</p>
          )}

          {syncLogs.length > 0 && (
            <ul className="mt-5 space-y-3">
              {syncLogs.map((log) => (
                <li key={log.id} className="rounded-xl border border-border bg-background/50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{format(new Date(log.date + 'T00:00:00'), 'EEEE, MMM d')}</p>
                    <button onClick={() => deleteSync(log.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  {log.summary && <p className="mt-1 text-sm text-muted-foreground">{log.summary}</p>}
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                    {log.wins && <div><span className="font-medium text-chart-2">Wins: </span><span className="text-muted-foreground">{log.wins}</span></div>}
                    {log.blockers && <div><span className="font-medium text-destructive">Blockers: </span><span className="text-muted-foreground">{log.blockers}</span></div>}
                    {log.commitments && <div><span className="font-medium text-primary">Next: </span><span className="text-muted-foreground">{log.commitments}</span></div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {editing && (
        <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{partner ? 'Edit partner' : 'Add accountability partner'}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Partner name</Label>
              <Input id="name" placeholder="e.g. Jane Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" placeholder="jane@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weekday">Recurring accountability day (optional)</Label>
            <select id="weekday" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.weekday} onChange={(e) => setForm({ ...form, weekday: e.target.value })}>
              <option value="">— None —</option>
              {WEEKDAY_LABELS.map((label, dow) => <option key={dow} value={String(dow)}>{label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" rows={3} placeholder="Focus areas, what to review, etc." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.name.trim() || !form.email.trim()}>
              {saving ? 'Saving…' : <>Save partner <Check className="ml-1 h-4 w-4" /></>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}