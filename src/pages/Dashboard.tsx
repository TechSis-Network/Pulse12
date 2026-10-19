import type { Cycle, Task } from '@/types/entities';
import type { WeekScore } from '@/types/pulse';
import { useMemo, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { Plus, Target, AlertCircle, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActiveCycle, useCycleData, useToggleTaskLog } from '@/lib/pulse/queries';
import { cycleWeekIndex, todayISO } from '@/lib/pulse/dates';
import { format } from 'date-fns';
import { tasksPlannedOnDate } from '@/lib/pulse/recurrence';
import { computeAllWeekScores, needsRecovery, computeStreak } from '@/lib/pulse/score';
import { setRecoveryActive } from '@/lib/pulse/cycleApi';
import { useQueryClient } from '@tanstack/react-query';
import EmptyState from '@/components/pulse/EmptyState';
import CycleHeader from '@/components/pulse/CycleHeader';
import ScoreWidget from '@/components/pulse/ScoreWidget';
import DailyChecklist from '@/components/pulse/DailyChecklist';
import GoalBadges from '@/components/pulse/GoalBadges';
import ScoreTrend from '@/components/pulse/ScoreTrend';
import ProgressTrend from '@/components/pulse/ProgressTrend';
import RecoveryPrompt from '@/components/pulse/RecoveryPrompt';
import WelcomeTour from '@/components/pulse/WelcomeTour';
import WeeklyReflection from '@/components/pulse/WeeklyReflection';
import StreakCounter from '@/components/pulse/StreakCounter';
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ensureNotification } from '@/lib/pulse/notifications';

export default function Dashboard() {
  const { data: cycle, isLoading: cycleLoading, isError: cycleError } = useActiveCycle();
  const qc = useQueryClient();
  const [recommitting, setRecommitting] = useState(false);

  if (cycleLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-primary" />
      </div>
    );
  }

  if (cycleError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn’t load your cycle"
        description="Something went wrong loading your active cycle. Please try again."
        action={<Button onClick={() => window.location.reload()}>Retry</Button>}
      />
    );
  }

  if (!cycle) {
    return (
      <div className="space-y-6">
        <WelcomeTour />
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Build your next 12 weeks</h1>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Pulse12 turns ambition into a disciplined 12-week cycle — define a vision, refine it into
            three core goals, and execute daily with a live execution score.
          </p>
          <Button asChild className="mt-6">
            <Link to="/setup"><Plus className="mr-2 h-4 w-4" /> Start a new cycle</Link>
          </Button>
        </div>
        <EmptyState
          icon={Target}
          title="No active cycle yet"
          description="Once you set up a cycle, your weekly score, daily actions, and goals will live here."
        />
      </div>
    );
  }

  return <ActiveDashboard cycle={cycle} qc={qc} recommitting={recommitting} setRecommitting={setRecommitting} />;
}

function ActiveDashboard({ cycle, qc, recommitting, setRecommitting }: { cycle: Cycle; qc: import("@tanstack/react-query").QueryClient; recommitting: boolean; setRecommitting: React.Dispatch<React.SetStateAction<boolean>> }) {
  const { data, isLoading, isError } = useCycleData(cycle.id);
  const toggleMutation = useToggleTaskLog(cycle.id);
  const today = todayISO();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ created: number; skipped: number; note?: string } | null>(null);
  const weekIndex = cycleWeekIndex(cycle.start_date);
  const celebratedWeek = useRef<number | null>(null);
  const prevStreak = useRef(0);
  const streakInit = useRef(false);

  const scores = useMemo(
    () => (data ? computeAllWeekScores(cycle, data!.tasks, data!.logsMap) : []),
    [cycle, data]
  );
  const currentScore: WeekScore = scores[weekIndex - 1] || { week: weekIndex, planned: 0, completed: 0, score: null, status: 'no_planned' };
  const trendScores = scores.slice(0, Math.max(weekIndex, 1));
  const todayTasks = useMemo(
    () => (data ? tasksPlannedOnDate(data!.tasks, new Date()) : []),
    [data]
  );
  const recovery = needsRecovery(scores, weekIndex);
  const streak = computeStreak(scores, weekIndex);

  useEffect(() => {
    if (!streakInit.current) {
      streakInit.current = true;
      prevStreak.current = streak;
      return;
    }
    if (prevStreak.current === 0 && streak >= 1) {
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.5 }, colors: ['#f59e0b', '#fb923c', '#fbbf24', '#ef4444'] });
    }
    prevStreak.current = streak;
  }, [streak]);

  useEffect(() => {
    if (!data || !cycle) return;
    if (currentScore.score === 100 && celebratedWeek.current !== weekIndex) {
      celebratedWeek.current = weekIndex;
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#10b981', '#6366f1', '#f59e0b', '#ec4899'] });
    }
    const today = todayISO();
    let didCreate = false;

    todayTasks.forEach((t) => {
      if (data!.logsMap[`${t.id}_${today}`]) return;
      if (!t.target_time) return;
      const [h, m] = t.target_time.split(':').map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);
      const diffMin = (target.getTime() - Date.now()) / 60000;
      if (diffMin <= 60 && diffMin >= -30) {
        ensureNotification({
          type: 'task',
          title: `Time for: ${t.title}`,
          body: `Scheduled for ${t.target_time}`,
          link: '/',
          ref_id: `task:${t.id}:${today}`,
        });
        didCreate = true;
      }
    });

    if (currentScore.score != null) {
      ensureNotification({
        type: 'score',
        title: `Week ${weekIndex} score: ${currentScore.score}%`,
        body: currentScore.status === 'green' ? 'On track — keep it up.' : 'Below benchmark. Recommit to your plan.',
        link: '/',
        ref_id: `score:${cycle.id}:W${weekIndex}`,
      });
      didCreate = true;
    }

    if (recovery && !cycle.recovery_active) {
      ensureNotification({
        type: 'recovery',
        title: 'Recovery week',
        body: 'Two weeks below benchmark. Recommit to your goals.',
        link: '/',
        ref_id: `recovery:${cycle.id}:W${weekIndex}`,
      });
      didCreate = true;
    }

    // Gentle daily nudge for top goals (nudge enabled) with incomplete tasks today
    data!.goals.forEach((goal) => {
      if (!goal.nudge_enabled) return;
      const goalTasks = todayTasks.filter((t) => t.goal_id === goal.id);
      if (goalTasks.length === 0) return;
      const incomplete = goalTasks.filter((t) => !data!.logsMap[`${t.id}_${today}`]);
      if (incomplete.length === 0) return;
      ensureNotification({
        type: 'task',
        title: `Nudge: ${goal.title}`,
        body: `${incomplete.length} task${incomplete.length > 1 ? 's' : ''} left today for your top goal.`,
        link: '/',
        ref_id: `nudge:${goal.id}:${today}`,
      });
      didCreate = true;
    });

    if (didCreate) qc.invalidateQueries({ queryKey: ['notifications'] });
  }, [data, cycle, weekIndex, currentScore, recovery, todayTasks, qc]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-primary" />
      </div>
    );
  }
  if (isError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn’t load your data"
        description="We couldn’t load your cycle data. Please try again."
        action={<Button onClick={() => qc.invalidateQueries({ queryKey: ['cycleData', cycle.id] })}>Retry</Button>}
      />
    );
  }

  const handleToggle = (task: Task) => {
    const currentlyDone = !!data!.logsMap[`${task.id}_${today}`];
    toggleMutation.mutate({ task, date: today, completed: !currentlyDone });
  };

  const handleRecommit = async () => {
    setRecommitting(true);
    try {
      await setRecoveryActive(cycle.id, true);
      await qc.invalidateQueries({ queryKey: ['activeCycle'] });
      await qc.invalidateQueries({ queryKey: ['cycleData', cycle.id] });
    } finally {
      setRecommitting(false);
    }
  };

  const handleSyncCalendar = async () => {
    const items = todayTasks
      .filter((t) => t.target_time)
      .map((t) => ({
        task_id: t.id,
        title: t.title,
        start: new Date(`${today}T${t.target_time}`).toISOString(),
        duration_minutes: t.duration_minutes || 30,
      }));
    if (items.length === 0) {
      setSyncResult({ created: 0, skipped: 0, note: 'No timed tasks today.' });
      return;
    }
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await base44.functions.invoke('syncTasksToCalendar', { date: today, items });
      setSyncResult(res.data);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <CycleHeader cycle={cycle} weekIndex={weekIndex} />

      {recovery && !cycle.recovery_active && (
        <RecoveryPrompt week={weekIndex} onRecommit={handleRecommit} recommitting={recommitting} />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ScoreWidget
            week={weekIndex}
            score={currentScore.score}
            status={currentScore.status}
            planned={currentScore.planned}
            completed={currentScore.completed}
          />
          <WeeklyReflection cycleId={cycle.id} week={weekIndex} score={currentScore.score} />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div>
              <p className="text-sm font-medium">Time-block your day</p>
              <p className="text-xs text-muted-foreground">Push today's timed tasks to Google Calendar as events.</p>
            </div>
            <div className="flex items-center gap-3">
              {syncResult && (
                <span className="text-xs text-muted-foreground">
                  {syncResult.note || `Created ${syncResult.created}${syncResult.skipped ? `, skipped ${syncResult.skipped}` : ''}`}
                </span>
              )}
              <Button size="sm" onClick={handleSyncCalendar} disabled={syncing || todayTasks.length === 0}>
                <CalendarCheck className="mr-1.5 h-4 w-4" /> {syncing ? 'Syncing…' : 'Sync to calendar'}
              </Button>
            </div>
          </div>
          <DailyChecklist
            tasks={todayTasks}
            goals={data!.goals}
            logsMap={data!.logsMap}
            dateISO={today}
            dateLabel={format(new Date(), 'EEEE, MMM d')}
            onToggle={handleToggle}
          />
        </div>
        <div className="space-y-6">
          <StreakCounter streak={streak} />
          <GoalBadges goals={data!.goals} />
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Score trend</h2>
            <div className="mt-4">
              <ScoreTrend scores={trendScores} />
            </div>
          </div>
        </div>
      </div>

      <ProgressTrend scores={scores} />
    </div>
  );
}
