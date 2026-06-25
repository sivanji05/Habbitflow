import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  CheckCircle,
  Trophy,
  Zap,
  TrendingUp,
  Award,
  ChevronRight,
  Sparkle,
  Sparkles,
  Smile,
  AlertCircle
} from 'lucide-react';
import { Habit, HabitLogs } from '../types';
import { MOTIVATIONAL_QUOTES } from '../data/defaultData';
import {
  calculateStreak,
  getOverallConsistencyScore,
  getTotalCompletions,
  getLastNDays
} from '../utils/habitUtils';
import LucideIcon from './LucideIcon';

interface DashboardViewProps {
  habits: Habit[];
  logs: HabitLogs;
  onToggleHabit: (habitId: string, dateStr: string) => void;
  searchQuery: string;
  onNavigate: (tab: 'dashboard' | 'habits' | 'analytics' | 'calendar' | 'reports' | 'settings') => void;
  currentDateStr: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  habits,
  logs,
  onToggleHabit,
  searchQuery,
  
  onNavigate,
  currentDateStr
}) => {
  const [quote, setQuote] = useState({ text: '', author: '' });
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');

  // Choose a random quote once on mount
  useEffect(() => {
    const idx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setQuote(MOTIVATIONAL_QUOTES[idx]);
  }, []);

  const activeHabits = habits.filter((h) => !h.archived);

  // Filter habit list based on global header search
  const filteredHabits = activeHabits.filter((h) =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats Calculations
  const completionsTodayCount = activeHabits.filter((h) => logs[currentDateStr]?.[h.id]).length;
  const totalActiveHabitsCount = activeHabits.length;
  const completionTodayRate = totalActiveHabitsCount > 0 ? Math.round((completionsTodayCount / totalActiveHabitsCount) * 100) : 0;

  // Global Streaks computations
  let currentStreakMax = 0;
  let bestStreakMax = 0;
  activeHabits.forEach((h) => {
    const { currentStreak, longestStreak } = calculateStreak(h.id, logs, currentDateStr);
    if (currentStreak > currentStreakMax) currentStreakMax = currentStreak;
    if (longestStreak > bestStreakMax) bestStreakMax = longestStreak;
  });

  const totalCompletionsValue = getTotalCompletions(logs);
  const consistencyScore30d = getOverallConsistencyScore(habits, logs, 30, currentDateStr);

  // Achievements/XP removed from dashboard

  // Handle habit tracking with click feedback
  const handleHabitToggle = (habitId: string, habitName: string) => {
    const wasCompleted = logs[currentDateStr]?.[habitId];
    onToggleHabit(habitId, currentDateStr);

    if (!wasCompleted) {
      // Trigger short visual celebration popup
      setCelebrationMessage(`Completed "${habitName}"! 🎉`);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2200);
    }
  };

  // Productivity Score representation (based on active habits, completion, and stats)
  const productivityScore = Math.min(
    100,
    Math.round((completionTodayRate * 0.4) + (consistencyScore30d * 0.6))
  );

  return (
    <div className="space-y-8" id="dashboard_view">
      {/* Dynamic Celebration Bubble */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="fixed bottom-6 right-6 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 z-50 border border-indigo-400 font-medium"
            id="toast_celebrate"
          >
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span>{celebrationMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative bg-gradient-to-r from-indigo-900/40 via-violet-950/20 to-slate-900/30 dark:bg-gradient-to-r dark:from-indigo-950/70 dark:via-slate-900/80 dark:to-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl overflow-hidden shadow-sm backdrop-blur-md"
        id="dashboard_hero"
      >
        <div className="absolute right-0 top-0 -mr-12 -mt-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-24 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
              <Sparkle className="w-3.5 h-3.5" /> Dynamic Dashboard
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              Welcome back to <span className="text-indigo-600 dark:text-indigo-400 font-black">Sivanji's HabbitFlow</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl italic">
              "{quote.text}"
              {quote.author && (
                <span className="block mt-1 text-xs text-indigo-500 font-semibold not-italic">— {quote.author}</span>
              )}
            </p>
          </div>

          {/* Progress Summary removed per request */}
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stats_cards_grid">
        {[
          {
            id: 'stat_streak',
            title: 'Current Streak',
            value: `🔥 ${currentStreakMax} Days`,
            desc: `Best record: ${bestStreakMax}d`,
            color: 'from-amber-500 to-orange-600',
            icon: 'Flame',
            bg: 'hover:border-amber-500/20 dark:hover:border-amber-500/30'
          },
          {
            id: 'stat_completed',
            title: "Today's Progress",
            value: `${completionsTodayCount}/${totalActiveHabitsCount}`,
            desc: `${completionTodayRate}% completed`,
            color: 'from-emerald-500 to-teal-600',
            icon: 'CheckCircle',
            bg: 'hover:border-emerald-500/20 dark:hover:border-emerald-500/30'
          },
          {
            id: 'stat_consistency',
            title: '30-Day Consistency',
            value: `${consistencyScore30d}%`,
            desc: `Productivity Score: ${productivityScore}`,
            color: 'from-indigo-500 to-violet-600',
            icon: 'TrendingUp',
            bg: 'hover:border-indigo-500/20 dark:hover:border-indigo-500/30'
          },
          {
            id: 'stat_badges',
            title: 'Total Completions',
            value: `${totalCompletionsValue}`,
            desc: `Overall completions recorded`,
            color: 'from-purple-500 to-pink-600',
            icon: 'Trophy',
            bg: 'hover:border-purple-500/20 dark:hover:border-purple-500/30'
          }
        ].map((stat) => (
          <motion.div
            key={stat.title}
            whileHover={{ y: -4 }}
            className={`cursor-pointer group flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs transition-all duration-300 ${stat.bg}`}
            onClick={() => {
              if (stat.icon === 'TrendingUp') onNavigate('analytics');
              else if (stat.icon === 'Trophy') onNavigate('reports');
              else if (stat.icon === 'CheckCircle') onNavigate('habits');
            }}
            id={stat.id}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                {stat.title}
              </span>
              <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-slate-800 group-hover:text-indigo-500 transition-colors`}>
                <LucideIcon name={stat.icon} size={18} />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                {stat.value}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {stat.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid: Today's Checklist + Sidebar Insights */}
      <div className="grid md:grid-cols-3 gap-6" id="dashboard_content_grid">
        {/* Today's Checklist Section (Interactive list) */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
              <span>Today's Habits</span>
              <span className="text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 px-2 py-0.5 rounded-full font-serif font-semibold">
                {completionsTodayCount} done
              </span>
            </h2>
            <button
              onClick={() => onNavigate('habits')}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              Manage Habits <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3" id="todays_habits_checklist">
            {filteredHabits.length === 0 ? (
              <div className="bg-slate-50/50 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {searchQuery ? "No habits match your search filter." : "You don't have any habits configured for today. Let's create your first habit to start your streak!"}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => onNavigate('habits')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all shadow-indigo-600/10 cursor-pointer"
                  >
                    + Create New Habit
                  </button>
                )}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredHabits.map((habit) => {
                  const isCompleted = !!logs[currentDateStr]?.[habit.id];
                  const { currentStreak } = calculateStreak(habit.id, logs, currentDateStr);

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ scale: 1.005 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      key={habit.id}
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-slate-900 border ${
                        isCompleted
                          ? 'border-emerald-500/30 bg-emerald-50/5 dark:bg-emerald-950/5'
                          : 'border-slate-200/80 dark:border-slate-800'
                      } rounded-2xl shadow-xxs transition-colors duration-300 gap-3`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className="p-3 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: habit.color }}
                        >
                          <LucideIcon name={habit.icon} size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm md:text-base leading-tight">
                              {habit.name}
                            </h3>
                            <span
                              className="text-xxs px-2 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                            >
                              {habit.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                            {habit.description}
                          </p>
                        </div>
                      </div>

                      {/* Complete Check Controls */}
                      <div className="flex items-center justify-between w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0 gap-4 shrink-0">
                        {/* Streak indication */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Flame className={`w-4 text-orange-500 ${currentStreak > 0 ? 'animate-bounce' : 'opacity-40'}`} />
                          <span className={`${currentStreak > 0 ? 'font-bold text-orange-500 dark:text-orange-400' : ''}`}>
                            {currentStreak}d streak
                          </span>
                        </div>

                        {/* Interactive Toggle Checkbox */}
                        <div className="flex items-center gap-2.5 select-none">
                          <span className={`text-xs font-bold transition-all ${isCompleted ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {isCompleted ? 'Done' : 'Mark Done'}
                          </span>
                          <button
                            onClick={() => handleHabitToggle(habit.id, habit.name)}
                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0 ${
                              isCompleted
                                ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                                : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-[#1E293B] hover:border-indigo-400'
                            }`}
                            id={`check_habit_${habit.id}`}
                            aria-checked={isCompleted}
                            role="checkbox"
                          >
                            {isCompleted && (
                              <svg className="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Dynamic AI-Style Productivity Insights Side Panel */}
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500" />
              <span>Smart Insights</span>
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-xxs">
            {/* Real-time calculated cards */}
            {activeHabits.length === 0 ? (
              <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-xs">
                Create habits to unlock smart productivity insights and consistency suggestions.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Insight 1: Most consistent */}
                <div className="flex gap-3">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 h-9 shrink-0 flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Highest Streak Active</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {bestStreakMax > 0 ? (
                        <>You are crushing your goal with a standard best streak of <span className="font-semibold text-indigo-500">{bestStreakMax} consecutive days</span>!</>
                      ) : (
                        "Begin logging your daily habits to lock in your first multi-day streak."
                      )}
                    </p>
                  </div>
                </div>

                {/* Insight 2: Productivity score feedback */}
                <div className="flex gap-3">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 h-9 shrink-0 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Productivity Level</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {productivityScore >= 80 ? (
                        <>Incredible consistency! Your score is <span className="font-extrabold text-emerald-500">{productivityScore}%</span>. You are maintaining a true champion status.</>
                      ) : productivityScore >= 50 ? (
                        <>Steady pace! Your score is <span className="font-semibold text-amber-500">{productivityScore}%</span>. Keeping this momentum builds long-term success.</>
                      ) : (
                        <>Kickstart your weekly momentum! Currently sitting at <span className="font-semibold text-red-500">{productivityScore}%</span>.</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Insight 3: Quick Category distribution tip */}
                <div className="flex gap-3">
                  <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 h-9 shrink-0 flex items-center justify-center">
                    <Smile className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Streak Booster</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Completing habits consistently increases your streaks and long-term consistency score. Focus on daily progress to build momentum.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Mini Calendar Preview */}
          <div className="bg-gradient-to-br from-indigo-50/50 via-white to-slate-50/50 dark:from-slate-900/40 dark:to-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl relative overflow-hidden shadow-xxs">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-3">Weekly View</h3>
            <div className="flex justify-between gap-1.5">
              {(() => {
                const datesOfThisWeek = getLastNDays(7, new Date(currentDateStr));
                const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

                return datesOfThisWeek.map((dateStr) => {
                  const parts = dateStr.split('-');
                  const dObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                  const label = weekdayLabels[dObj.getDay()];
                  const isToday = dateStr === currentDateStr;
                  
                  // Compute completed vs active count for that day
                  const completedOnDay = activeHabits.filter((h) => logs[dateStr]?.[h.id]).length;
                  const scoreOnDay = totalActiveHabitsCount > 0 ? (completedOnDay / totalActiveHabitsCount) : 0;

                  let circleColor = 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600';
                  if (scoreOnDay === 1) {
                    circleColor = 'bg-emerald-500 text-white';
                  } else if (scoreOnDay > 0) {
                    circleColor = 'bg-indigo-600 text-white';
                  } else if (completedOnDay > 0) {
                    circleColor = 'bg-indigo-400 text-white';
                  }

                  return (
                    <div key={dateStr} className="flex flex-col items-center gap-2 flex-1">
                      <span className="text-xxs font-extrabold text-slate-400 dark:text-slate-500">{label}</span>
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all relative ${circleColor} ${
                          isToday ? 'ring-2 ring-indigo-600 dark:ring-indigo-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''
                        }`}
                        title={`${dateStr}: ${completedOnDay}/${totalActiveHabitsCount} done`}
                      >
                        {isToday ? <div className="absolute -top-1 w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" /> : null}
                        {dObj.getDate()}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            <button
              onClick={() => onNavigate('calendar')}
              className="mt-4 text-xxs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center w-full gap-0.5"
            >
              Examine full Calendar <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
