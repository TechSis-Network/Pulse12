import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, ListChecks, CalendarCheck, Users, Trophy, ArrowRight, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'pulse12:tutorial_done';

const STEPS = [
  {
    icon: Target,
    title: 'Start a 12-week cycle',
    description: 'Define a vision for the next 12 weeks, then refine it into up to 3 core goals. Each goal needs a clear success metric so you know when you’ve won.',
  },
  {
    icon: ListChecks,
    title: 'Add daily & weekly tasks',
    description: 'Break each goal into recurring actions. Daily tasks build the habit; weekly tasks keep momentum. Set a target time so you stay on schedule.',
  },
  {
    icon: CalendarCheck,
    title: 'Check in & time-block',
    description: 'Each day, check off completed tasks on your dashboard. Use “Sync to calendar” to push timed tasks to Google Calendar with a Meet link.',
  },
  {
    icon: Trophy,
    title: 'Watch your execution score',
    description: 'Pulse12 scores you weekly based on completed vs. planned tasks. Stay green (85%+). Two amber weeks in a row triggers a recovery week.',
  },
  {
    icon: Users,
    title: 'Bring in an accountability partner',
    description: 'Add a mentor or peer, book weekly review sessions, and log wins, blockers, and commitments in the Accountability portal.',
  },
];

export default function WelcomeTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch { /* localStorage unavailable */ }
  }, []);

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    setOpen(false);
  };

  const isLast = step === STEPS.length - 1;
  const Icon = STEPS[step].icon;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) finish(); else setOpen(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl">{STEPS[step].title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">{STEPS[step].description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-secondary'}`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          <span className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
            )}
            {isLast ? (
              <Button size="sm" asChild onClick={finish}>
                <Link to="/setup">Start your cycle <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep(step + 1)}>
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}