// Entity contracts mirrored from base44/entities. Server fields are added by the SDK.
import type { EntityRecord } from '@base44/sdk';

export interface AccountabilityPartnerFields {
  name: string;
  email?: string | null;
  booking_url?: string | null;
  weekday?: number | null;
  notes?: string | null;
}

export interface CalendarSyncFields {
  task_id: string;
  date: string;
  event_id: string;
  calendar_id?: string | null;
  synced_at?: string | null;
}

export interface GoalFields {
  cycle_id: string;
  title: string;
  description?: string | null;
  success_metric?: string | null;
  order?: number | null;
  nudge_enabled?: boolean | null;
}

export interface NotificationFields {
  type: "meeting" | "score" | "recovery" | "task";
  title: string;
  body?: string | null;
  link: string;
  meet_link?: string | null;
  ref_id?: string | null;
  read?: boolean | null;
}

export interface ReflectionFields {
  cycle_id: string;
  week_number: number;
  what_worked?: string | null;
  what_didnt?: string | null;
}

export interface SyncLogFields {
  partner_id?: string | null;
  date: string;
  summary?: string | null;
  wins?: string | null;
  blockers?: string | null;
  commitments?: string | null;
}

export interface TaskFields {
  cycle_id: string;
  goal_id?: string | null;
  title: string;
  recurrence_type: "daily" | "weekly" | "one_time";
  weekdays?: (number)[] | null;
  target_time?: string | null;
  duration_minutes?: number | null;
  one_time_date?: string | null;
  active?: boolean | null;
}

export interface TaskLogFields {
  task_id: string;
  cycle_id?: string | null;
  date: string;
  completed?: boolean | null;
  completed_at?: string | null;
}

export interface UserFields {
  role: "admin" | "user";
}

export interface WeeklyScoreFields {
  cycle_id: string;
  week_number: number;
  planned_count?: number | null;
  completed_count?: number | null;
  score?: number | null;
  status?: "green" | "amber" | "no_planned" | null;
  calculated_at?: string | null;
}

// Cycle.jsonc is empty in this checkout; these fields reflect cycleApi and the UI.
export interface CycleFields {
  title: string; vision?: string; brain_dump?: string; status: 'active' | 'completed' | 'draft';
  start_date: string; end_date: string; goals_count?: number; recovery_active?: boolean;
}

declare module '@base44/sdk' {
  interface EntityTypeRegistry {
    AccountabilityPartner: AccountabilityPartnerFields;
    CalendarSync: CalendarSyncFields;
    Goal: GoalFields;
    Notification: NotificationFields;
    Reflection: ReflectionFields;
    SyncLog: SyncLogFields;
    Task: TaskFields;
    TaskLog: TaskLogFields;
    User: UserFields;
    WeeklyScore: WeeklyScoreFields;
    Cycle: CycleFields;
  }
}

export type AccountabilityPartner = EntityRecord['AccountabilityPartner'];
export type CalendarSync = EntityRecord['CalendarSync'];
export type Goal = EntityRecord['Goal'];
export type Notification = EntityRecord['Notification'];
export type Reflection = EntityRecord['Reflection'];
export type SyncLog = EntityRecord['SyncLog'];
export type Task = EntityRecord['Task'];
export type TaskLog = EntityRecord['TaskLog'];
export type User = EntityRecord['User'];
export type WeeklyScore = EntityRecord['WeeklyScore'];
export type Cycle = EntityRecord['Cycle'];
