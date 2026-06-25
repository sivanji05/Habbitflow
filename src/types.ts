export type HabitCategory =
  | 'Health'
  | 'Fitness'
  | 'Coding'
  | 'Learning'
  | 'Reading'
  | 'Meditation'
  | 'Work'
  | 'Finance'
  | 'Custom';

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: HabitCategory;
  icon: string; // lucide-react icon name as a string
  color: string; // e.g. '#6366F1' (Indigo), '#10B981' (Emerald)
  frequency: 'daily' | 'weekly';
  goal: number; // e.g., times per day/week (usually 1 for daily tracking)
  startDate: string; // YYYY-MM-DD
  archived: boolean;
  createdAt: string;
}

// Map of date (YYYY-MM-DD) to a map of habit ID to True/False (completed)
export interface HabitLogs {
  [date: string]: {
    [habitId: string]: boolean;
  };
}

export interface UserStats {
  totalCompletions: number;
  currentStreakCount: number;
  bestStreakCount: number;
}

export interface AppState {
  habits: Habit[];
  logs: HabitLogs;
  theme: 'dark' | 'light';
  activeTab: 'dashboard' | 'habits' | 'analytics' | 'calendar' | 'reports' | 'settings';
  searchQuery: string;
}
