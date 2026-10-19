import type { CycleDraft, GoalDraft, TaskDraft } from '@/types/pulse';
import { asError } from '@/lib/errors';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Plus, X, CalendarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/AuthContext';
import { activateCycle } from '@/lib/pulse/cycleApi';
import { goalLimit } from '@/lib/pulse/subscription';
import { WEEKDAY_LABELS } from '@/lib/pulse/dates';
import { cn } from '@/lib/utils';

const STEPS = ['Vision', 'Brain dump', 'Goals', 'Schedule', 'Calendar', 'Activate'];

let tempId = 0;
const newTempId = () => `t${++tempId}`;

export default function Setup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tier = user?.data?.subscription_tier || 'free';
  const limit = goalLimit(tier);

  const [step, setStep] = useState(1);
  const [cycle, setCycle] = useState<CycleDraft>({ title: '', vision: '', brain_dump: '' });
  const [goals, setGoals] = useState<GoalDraft[]>([{ tempId: 'g1', title: '', description: '', success_metric: '' }]);
  const [tasks, setTasks] = useState<TaskDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const validGoals = goals.filter((g) => g.title.trim());
  const validTasks = tasks.filter((t) => t.title.trim());

  const canNext = () => {
    if (step === 1) return cycle.title.trim().length > 0;
    if (step === 2) return true;
    if (step === 3) return validGoals.length >= 1;
    if (step === 4) return true;
    if (step === 5) return true;
    return true;
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const addGoal = () => {
    if (goals.length < limit) setGoals([...goals, { tempId: newTempId(), title: '', description: '', success_metric: '' }]);
  };
  const updateGoal = (id: string, patch: Partial<GoalDraft>) => setGoals(goals.map((g) => (g.tempId === id ? { ...g, ...patch } : g)));
  const removeGoal = (id: string) => setGoals(goals.filter((g) => g.tempId !== id));

  const addTask = () => setTasks([...tasks, { tempId: newTempId(), title: '', goal_id: '', recurrence_type: 'daily', weekdays: [1, 2, 3, 4, 5], target_time: '', duration_minutes: null, one_time_date: '' }]);
  const updateTask = (id: string, patch: Partial<TaskDraft>) => setTasks(tasks.map((t) => (t.tempId === id ? { ...t, ...patch } : t)));
  const removeTask = (id: string) => setTasks(tasks.filter((t) => t.tempId !== id));

  const toggleWeekday = (id: string, dow: number) => {
    setTasks(tasks.map((t) => {
      if (t.tempId !== id) return t;
      const set = new Set(t.weekdays || []);
      if (set.has(dow)) set.delete(dow);
      else set.add(dow);
      return { ...t, weekdays: [...set].sort() };
    }));
  };

  const importBrainDump = () => {
    const lines = cycle.brain_dump.split('\n').map((l) => l.replace(/^[-•*\d.\s]+/, '').trim()).filter(Boolean);
    if (lines.length === 0) return;
    setTasks(lines.map((title) => ({ tempId: newTempId(), title, goal_id: '', recurrence_type: 'daily', weekdays: [1, 2, 3, 4, 5], target_time: '', duration_minutes: null, one_time_date: '' })));
  };

  const activate = async () => {
    setSubmitting(true);
    setError('');
    try {
      await activateCycle({ cycle, goals: validGoals, tasks: validTasks, tier });
      navigate('/');
    } catch (caughtError) {
    const e = asError(caughtError);
      setError(e?.message || 'Could not activate your cycle. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Stepper step={step} />

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {step === 1 && <VisionStep cycle={cycle} setCycle={setCycle} />}
        {step === 2 && <BrainDumpStep cycle={cycle} setCycle={setCycle} />}
        {step === 3 && (
          <GoalsStep
            goals={goals}
            addGoal={addGoal}
            updateGoal={updateGoal}
            removeGoal={removeGoal}
            limit={limit}
            tier={tier}
          />
        )}
        {step === 4 && (
          <ScheduleStep
            tasks={tasks}
            goals={validGoals}
            addTask={addTask}
            updateTask={updateTask}
            removeTask={removeTask}
            toggleWeekday={toggleWeekday}
            importBrainDump={importBrainDump}
            hasBrainDump={cycle.brain_dump.trim().length > 0}
          />
        )}
        {step === 5 && <CalendarStep />}
        {step === 6 && <ReviewStep cycle={cycle} goals={validGoals} tasks={validTasks} />}

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 1 || submitting}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {step < STEPS.length ? (
            <Button onClick={next} disabled={!canNext()}>
              Continue <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={activate} disabled={submitting}>
              {submitting ? 'Activating…' : 'Activate cycle'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
              done ? 'bg-primary text-primary-foreground' : active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            )}>
              {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : n}
            </div>
            <span className={cn('hidden text-xs font-medium sm:inline', active ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-border sm:w-8" />}
          </div>
        );
      })}
    </div>
  );
}

function VisionStep({ cycle, setCycle }: { cycle: CycleDraft; setCycle: React.Dispatch<React.SetStateAction<CycleDraft>> }) {
  return (
    <div className="space-y-5">
      <Header title="Vision & desired outcome" subtitle="Name this cycle and describe the outcome you’re committing to." />
      <div className="space-y-2">
        <Label htmlFor="title">Cycle name</Label>
        <Input id="title" placeholder="e.g. Q3 Growth Sprint" value={cycle.title} onChange={(e) => setCycle({ ...cycle, title: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vision">Vision</Label>
        <Textarea id="vision" rows={5} placeholder="What does success look like at the end of 12 weeks?" value={cycle.vision} onChange={(e) => setCycle({ ...cycle, vision: e.target.value })} />
      </div>
    </div>
  );
}

function BrainDumpStep({ cycle, setCycle }: { cycle: CycleDraft; setCycle: React.Dispatch<React.SetStateAction<CycleDraft>> }) {
  return (
    <div className="space-y-5">
      <Header title="Brain dump every action step" subtitle="List everything you think you need to do. Don’t filter — you’ll refine next." />
      <Textarea rows={10} placeholder={"Call 20 prospects\nPublish 3 case studies\nHire a designer\n..."} value={cycle.brain_dump} onChange={(e) => setCycle({ ...cycle, brain_dump: e.target.value })} />
      <p className="text-xs text-muted-foreground">One action per line. You can turn these into scheduled tasks in the next step.</p>
    </div>
  );
}

function GoalsStep({ goals, addGoal, updateGoal, removeGoal, limit, tier }: { goals: GoalDraft[]; addGoal: () => void; updateGoal: (id: string, patch: Partial<GoalDraft>) => void; removeGoal: (id: string) => void; limit: number; tier: string }) {
  return (
    <div className="space-y-5">
      <Header title="Refine into core goals" subtitle={`The Rule of 3 — focus on what matters most. ${tier === 'pro' ? 'Up to 3 goals.' : 'Free plan: 1 active goal (upgrade for up to 3).'}`} />
      {goals.map((g, i) => (
        <div key={g.tempId} className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Goal {i + 1}</span>
            {goals.length > 1 && (
              <button onClick={() => removeGoal(g.tempId)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
            )}
          </div>
          <Input className="mt-2" placeholder="Goal title" value={g.title} onChange={(e) => updateGoal(g.tempId, { title: e.target.value })} />
          <Input className="mt-2" placeholder="Success metric (how you’ll measure it)" value={g.success_metric} onChange={(e) => updateGoal(g.tempId, { success_metric: e.target.value })} />
        </div>
      ))}
      {goals.length < limit && (
        <Button variant="outline" size="sm" onClick={addGoal}><Plus className="mr-1 h-4 w-4" /> Add goal</Button>
      )}
    </div>
  );
}

function ScheduleStep({ tasks, goals, addTask, updateTask, removeTask, toggleWeekday, importBrainDump, hasBrainDump }: { tasks: TaskDraft[]; goals: GoalDraft[]; addTask: () => void; updateTask: (id: string, patch: Partial<TaskDraft>) => void; removeTask: (id: string) => void; toggleWeekday: (id: string, day: number) => void; importBrainDump: () => void; hasBrainDump: boolean }) {
  return (
    <div className="space-y-5">
      <Header title="Schedule your actions" subtitle="Assign recurrence, days, times, and durations. Tie each to a goal." />
      {tasks.length === 0 && hasBrainDump && (
        <Button variant="outline" size="sm" onClick={importBrainDump}><Plus className="mr-1 h-4 w-4" /> Import from brain dump</Button>
      )}
      {tasks.map((t) => (
        <div key={t.tempId} className="space-y-3 rounded-xl border border-border p-4">
          <div className="flex items-center gap-2">
            <Input placeholder="Action title" value={t.title} onChange={(e) => updateTask(t.tempId, { title: e.target.value })} className="flex-1" />
            <button onClick={() => removeTask(t.tempId)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Goal</Label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={t.goal_id} onChange={(e) => updateTask(t.tempId, { goal_id: e.target.value })}>
                <option value="">— None —</option>
                {goals.map((g) => <option key={g.tempId} value={g.tempId}>{g.title}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Recurrence</Label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={t.recurrence_type} onChange={(e) => updateTask(t.tempId, { recurrence_type: e.target.value as TaskDraft['recurrence_type'] })}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly (specific days)</option>
                <option value="one_time">One-time</option>
              </select>
            </div>
          </div>
          {t.recurrence_type === 'weekly' && (
            <div className="flex flex-wrap gap-1">
              {WEEKDAY_LABELS.map((label, dow) => (
                <button key={dow} type="button" onClick={() => toggleWeekday(t.tempId, dow)}
                  className={cn('h-8 w-9 rounded-md border text-xs font-medium transition-colors', (t.weekdays || []).includes(dow) ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground')}>
                  {label[0]}
                </button>
              ))}
            </div>
          )}
          {t.recurrence_type === 'one_time' && (
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={t.one_time_date || ''} onChange={(e) => updateTask(t.tempId, { one_time_date: e.target.value })} />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Target time</Label>
              <Input type="time" value={t.target_time || ''} onChange={(e) => updateTask(t.tempId, { target_time: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Duration (min)</Label>
              <Input type="number" min="1" placeholder="30" value={t.duration_minutes ?? ''} onChange={(e) => updateTask(t.tempId, { duration_minutes: e.target.value ? Number(e.target.value) : null })} />
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addTask}><Plus className="mr-1 h-4 w-4" /> Add action</Button>
    </div>
  );
}

function CalendarStep() {
  return (
    <div className="space-y-5">
      <Header title="Connect your calendar" subtitle="Time-block your actions and keep them in sync. Optional — you can skip for now." />
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground"><CalendarOff className="h-5 w-5" /></span>
        <div>
          <p className="text-sm font-medium">Google Calendar</p>
          <p className="text-xs text-muted-foreground">Calendar sync arrives in the next phase. Continue without it for now.</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">You can connect a calendar later from Settings → Integrations.</p>
    </div>
  );
}

function ReviewStep({ cycle, goals, tasks }: { cycle: CycleDraft; goals: GoalDraft[]; tasks: TaskDraft[] }) {
  return (
    <div className="space-y-5">
      <Header title="Review & activate" subtitle="Confirm your plan. Your cycle starts today and runs for 12 weeks." />
      <div className="rounded-xl border border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cycle</p>
        <p className="mt-1 font-medium">{cycle.title || 'Untitled cycle'}</p>
        {cycle.vision && <p className="mt-1 text-sm text-muted-foreground">{cycle.vision}</p>}
      </div>
      <div className="rounded-xl border border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Goals ({goals.length})</p>
        <ul className="mt-2 space-y-1">
          {goals.map((g) => <li key={g.tempId} className="text-sm">• {g.title}</li>)}
        </ul>
      </div>
      <div className="rounded-xl border border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions ({tasks.length})</p>
        <ul className="mt-2 space-y-1">
          {tasks.map((t) => <li key={t.tempId} className="text-sm">• {t.title} <span className="text-muted-foreground">— {t.recurrence_type}</span></li>)}
        </ul>
      </div>
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}