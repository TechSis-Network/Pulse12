import type { Notification } from '@/types/entities';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarClock, Gauge, ShieldAlert, CheckCheck, Video } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications, markRead, markAllRead } from '@/lib/pulse/notifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const TYPE = {
  meeting: { icon: CalendarClock, tint: 'bg-primary/10 text-primary' },
  score: { icon: Gauge, tint: 'bg-chart-2/15 text-chart-2' },
  recovery: { icon: ShieldAlert, tint: 'bg-destructive/10 text-destructive' },
  task: { icon: Bell, tint: 'bg-chart-3/15 text-chart-3' },
};

export default function NotificationsBell() {
  const { data: notifications = [] } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read);

  const openNotif = async (n: Notification) => {
    setOpen(false);
    if (!n.read) await markRead(n.id);
    if (n.link) navigate(n.link);
  };

  const handleMarkAll = async () => {
    await markAllRead(unread.map((n) => n.id));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread.length > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread.length > 0 && (
            <button onClick={handleMarkAll} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => {
                const cfg = TYPE[n.type] || TYPE.task;
                const Icon = cfg.icon;
                return (
                  <li key={n.id}>
                    <div
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/60',
                        !n.read && 'bg-primary/5'
                      )}
                    >
                      <button onClick={() => openNotif(n)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                        <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', cfg.tint)}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">{n.title}</span>
                            {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                          </span>
                          {n.body && <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">{n.body}</span>}
                          {n.created_date && (
                            <span className="mt-1 block text-[11px] text-muted-foreground/70">
                              {formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}
                            </span>
                          )}
                        </span>
                      </button>
                      {n.meet_link && (
                        <a
                          href={n.meet_link}
                          target="_blank"
                          rel="noreferrer"
                          onClick={async (e) => { e.stopPropagation(); if (!n.read) await markRead(n.id); }}
                          className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          <Video className="h-3.5 w-3.5" /> Join
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}