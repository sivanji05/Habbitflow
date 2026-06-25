import { Habit, HabitLogs } from '../types';

// Use today's date dynamically for starter habits
const TODAY = new Date().toISOString().slice(0, 10);
const NOW = new Date().toISOString();

export const STARTER_HABITS: Habit[] = [
  {
    id: 'h1',
    name: 'Workout',
    description: 'Strength training or cardio session at the gym',
    category: 'Fitness',
    icon: 'Dumbbell',
    color: '#10B981',
    frequency: 'daily',
    goal: 1,
    startDate: TODAY,
    archived: false,
    createdAt: NOW,
  },
  {
    id: 'h2',
    name: 'Read Book',
    description: 'Read at least 15 pages of non-fiction or literature',
    category: 'Reading',
    icon: 'BookOpen',
    color: '#6366F1',
    frequency: 'daily',
    goal: 1,
    startDate: TODAY,
    archived: false,
    createdAt: NOW,
  },
  {
    id: 'h3',
    name: 'Coding Practice',
    description: 'Solve algorithms or work on a side project',
    category: 'Coding',
    icon: 'Code2',
    color: '#8B5CF6',
    frequency: 'daily',
    goal: 1,
    startDate: TODAY,
    archived: false,
    createdAt: NOW,
  },
  {
    id: 'h4',
    name: 'Drink Water',
    description: 'Consume at least 3 liters of pure water',
    category: 'Health',
    icon: 'Droplet',
    color: '#0EA5E9',
    frequency: 'daily',
    goal: 1,
    startDate: TODAY,
    archived: false,
    createdAt: NOW,
  },
  {
    id: 'h5',
    name: 'Meditation',
    description: 'Mindful breathing and awareness exercises',
    category: 'Meditation',
    icon: 'Sparkles',
    color: '#F59E0B',
    frequency: 'daily',
    goal: 1,
    startDate: TODAY,
    archived: false,
    createdAt: NOW,
  },
  {
    id: 'h6',
    name: 'Learn AI',
    description: 'Read AI papers or experiment with LLM prompts and SDKs',
    category: 'Learning',
    icon: 'Brain',
    color: '#EC4899',
    frequency: 'daily',
    goal: 1,
    startDate: TODAY,
    archived: false,
    createdAt: NOW,
  },
];

export const MOTIVATIONAL_QUOTES = [
  { text: "Don't forget where you are." },
  { text: "Don't forget what you become."},
  { text: "Don't forget what you came from."},];

export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateDefaultLogs(): HabitLogs {
  return {};
}
