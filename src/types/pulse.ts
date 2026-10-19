import type { Cycle, Goal, Task, TaskLog, WeeklyScore } from './entities';

export type LogsMap = Record<string, boolean>;
export type ScoreStatus = 'green' | 'amber' | 'no_planned';
export interface WeekScore {
  week: number;
  planned: number;
  completed: number;
  score: number | null;
  status: ScoreStatus;
}
export interface CycleData {
  goals: Goal[];
  tasks: Task[];
  logs: TaskLog[];
  scores: WeeklyScore[];
  logsMap: LogsMap;
}
export type CycleDraft = Required<Pick<Cycle, 'title' | 'vision' | 'brain_dump'>>;
export interface GoalDraft {
  tempId: string;
  title: string;
  description: string;
  success_metric: string;
}
export interface TaskDraft {
  tempId: string;
  title: string;
  goal_id: string;
  recurrence_type: Task['recurrence_type'];
  weekdays: number[];
  target_time: string;
  duration_minutes: number | null;
  one_time_date: string;
}
export interface ToggleTaskLogInput {
  task: Task;
  date: string;
  completed: boolean;
}
