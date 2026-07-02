import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  HelpCircle,
  XCircle,
  Calendar as CalendarIcon,
  Flame,
  UserCheck,
  Check,
  Plus
} from 'lucide-react';
import { Habit, HabitLogs } from '../types';
import { formatDate } from '../utils/habitUtils';
import LucideIcon from './LucideIcon';

interface CalendarViewProps {
  habits: Habit[];
  logs: HabitLogs;
  onToggleHabit: (habitId: string, dateStr: string) => void;
  currentDateStr: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  habits,
  logs,
  onToggleHabit,
  currentDateStr
}) => {
  // Local active calendar date navigation
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  

  // Use current selected date
  const [selectedDateStr, setSelectedDateStr] = useState(currentDateStr);

  const activeHabits = habits.filter((h) => !h.archived);

  // Month information computation
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Helper to generate Gregorian day lists for current Month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sun, 6 is Sat

  const calendarDays: (number | null)[] = [];
  // Padds previous days with empty slots
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  // Populates active dates of the current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Check completions for a specific day string
  const getDayProgress = (dStr: string) => {
    const dayLogs = logs[dStr] || {};
    const completedCount = activeHabits.filter((h) => dayLogs[h.id]).length;
    return {
      completedCount,
      totalCount: activeHabits.length,
      ratio: activeHabits.length > 0 ? (completedCount / activeHabits.length) : 0
    };
  };

  return (
    <div className="space-y-6" id="calendar_routines_view">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
          <CalendarIcon className="text-indigo-500" />
          <span>Interactive Tracker Calendar</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Backdate routine completions, audit chronological logs, and trace your historical discipline patterns.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Side: Calendar Box */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-xs">
          {/* Calendar top controls */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1 font-serif">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <div className="flex gap-2.5">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xxs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2.5" id="calendar_grid_days">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square bg-transparent rounded-xl" />;
              }

              // Compute YYYY-MM-DD
              const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = dStr === selectedDateStr;
              const isToday = dStr === currentDateStr;

              const { completedCount, totalCount, ratio } = getDayProgress(dStr);

              // Styling categories depending on completion index
              let cellClass = 'bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-300';
              let borderStyle = 'border border-slate-100 dark:border-slate-850 hover:border-slate-300';
              let dotElements: React.ReactNode = null;

              if (completedCount > 0) {
                if (ratio === 1) {
                  cellClass = 'bg-emerald-500 text-white font-extrabold shadow-sm';
                  borderStyle = 'border border-emerald-400';
                } else if (ratio >= 0.5) {
                  cellClass = 'bg-indigo-600 text-white font-extrabold shadow-sm';
                  borderStyle = 'border border-indigo-500';
                } else {
                  cellClass = 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300';
                  borderStyle = 'border border-indigo-550/15';
                }
              }

              return (
                <motion.button
                  key={`day-${day}`}
                  whileHover={{ scale: 1.05 }}
                  whileActive={{ scale: 0.95 }}
                  className={`aspect-square p-2 rounded-2xl flex flex-col justify-between items-center cursor-pointer transition-all ${cellClass} ${borderStyle} ${
                    isSelected ? 'ring-2 ring-violet-500 dark:ring-white border-2' : ''
                  } ${
                    isToday ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 border border-emerald-400' : ''
                  }`}
                  onClick={() => setSelectedDateStr(dStr)}
                >
                  <div className="flex justify-between w-full items-start">
                    <span className="text-xs font-bold font-mono">{day}</span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" title="Today" />
                    )}
                  </div>

                  {/* Tiny progress dots */}
                  {completedCount > 0 ? (
                    <div className="flex gap-0.5 justify-center mt-1 scale-85">
                      {Array.from({ length: Math.min(completedCount, 4) }).map((_, dIdx) => (
                        <div
                          key={dIdx}
                          className={`w-1 h-1 rounded-full ${
                            ratio === 1 || ratio >= 0.5 ? 'bg-white' : 'bg-indigo-500'
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="h-1.5" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Quick instructions indicator list */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-4 text-xxs font-bold text-slate-400 uppercase tracking-widest justify-center">
            <span className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-lg bg-emerald-500" /> Fully Completed Days
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-lg bg-indigo-600" /> Partially Completed Days
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-lg bg-slate-50/50 dark:bg-slate-950 border border-slate-200" /> Untracked Days
            </span>
          </div>
        </div>

        {/* Right Side: Backdate Context Detail Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <CalendarIcon size={18} className="text-indigo-600" />
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-50 text-sm md:text-base leading-none">
                  Backdate Tracker Panel
                </h3>
                <span className="text-xxs font-mono text-slate-500 inline-block mt-1">
                  Selected date: <span className="text-indigo-500 font-extrabold">{selectedDateStr}</span>
                </span>
              </div>
            </div>

            {/* List of active habits & completion toggler for selected date */}
            <div className="space-y-3.5" id="date_habits_backdate_checklist">
              {activeHabits.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  Create active habits to utilize backdating logs.
                </p>
              ) : (
                activeHabits.map((habit) => {
                  const isCompleted = !!logs[selectedDateStr]?.[habit.id];

                  return (
                    <div
                      key={habit.id}
                      className={`flex justify-between items-center p-3 rounded-xl border transition-colors ${
                        isCompleted
                          ? 'border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/5'
                          : 'border-slate-100 dark:border-slate-850 bg-slate-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: habit.color }}
                        >
                          <LucideIcon name={habit.icon} size={14} />
                        </div>
                        <div className="max-w-[120px] sm:max-w-[150px]">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                            {habit.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {habit.category}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onToggleHabit(habit.id, selectedDateStr)}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0 ${
                          isCompleted
                            ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 hover:border-indigo-400 text-slate-400'
                        }`}
                        title={isCompleted ? "Mark Incomplete" : "Mark Complete"}
                        id={`btn_toggle_log_${habit.id}_${selectedDateStr}`}
                      >
                        {isCompleted && (
                          <svg className="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* General metrics */}
            {activeHabits.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-850 text-xs">
                <div className="flex justify-between font-serif">
                  <span className="text-slate-500 font-bold">Success Ratio:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-100">
                    {Math.round(getDayProgress(selectedDateStr).ratio * 100)}%
                  </span>
                </div>
                <div className="flex justify-between font-serif">
                  <span className="text-slate-500 font-bold">Completed Routines:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-100">
                    {getDayProgress(selectedDateStr).completedCount} / {activeHabits.length}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
