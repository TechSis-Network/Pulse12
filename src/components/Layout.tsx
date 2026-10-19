import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, Plus, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import NotificationsBell from '@/components/pulse/NotificationsBell';
import ThemeToggle from '@/components/pulse/ThemeToggle';
import FunBackground from '@/components/pulse/FunBackground';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/setup', label: 'New Cycle', icon: Plus },
  { to: '/accountability', label: 'Accountability', icon: Users },
];

export default function Layout() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="relative min-h-screen bg-background">
      <FunBackground />
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <motion.span
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Activity className="h-4 w-4" />
            </motion.span>
            <span className="text-lg">Pulse<span className="text-primary">12</span></span>
          </Link>

          <nav className="ml-auto flex items-center gap-1">
            {navItems.map((item) => {
              const active = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
            <ThemeToggle />
            <NotificationsBell />
            {user && (
              <button
                onClick={() => logout()}
                className="ml-1 hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
              >
                Sign out
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}