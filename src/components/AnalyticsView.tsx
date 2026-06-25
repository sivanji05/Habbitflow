import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Habit, HabitLogs } from '../types';
import { useHabitStore } from '../store/useHabitStore';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  getLastNDays,
  formatDate,
  getCompletionDistribution,
  getWeekdayCompletions,
  getMonthlyConsistencyTrends,
  getHabitEfficiencyList,
  getOverallConsistencyScore
} from '../utils/habitUtils';
import LucideIcon from './LucideIcon';

interface AnalyticsViewProps {
  habits: Habit[];
  logs: HabitLogs;
  currentDateStr: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ habits, logs, currentDateStr }) => {
  const [timeRange, setTimeRange] = useState<30 | 14 | 7>(30);
  const [dbData, setDbData] = useState<Array<{ date: string; count: number }>>([]);
  const [loadingDb, setLoadingDb] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const syncLocalDataToSupabase = useHabitStore((s) => s.syncLocalDataToSupabase);
  const isSyncing = useHabitStore((s) => s.isSyncing);
  const syncSuccessMessage = useHabitStore((s) => s.syncSuccessMessage);
  const storeError = useHabitStore((s) => s.error);

  const activeHabits = habits.filter((h) => !h.archived);

  // Computed data for components
  const pieData = getCompletionDistribution(habits, logs, timeRange, currentDateStr);
  const weekdayData = getWeekdayCompletions(habits, logs, timeRange === 30 ? 4 : 2, currentDateStr);
  const lineData = getMonthlyConsistencyTrends(habits, logs, currentDateStr);
  const efficiencyList = getHabitEfficiencyList(activeHabits, logs, timeRange, currentDateStr);
  const consistencyScore = getOverallConsistencyScore(habits, logs, timeRange, currentDateStr);

  // Heatmap generation: last 6 weeks (42 days)
  const heatmapDays = getLastNDays(42, new Date(currentDateStr));

  const fetchDbDailyCounts = async (days: number) => {
    if (!isSupabaseConfigured || !supabase) {
      setDbError('Supabase not configured');
      setDbData([]);
      return;
    }

    setLoadingDb(true);
    setDbError(null);

    try {
      const startDate = getLastNDays(days, new Date(currentDateStr)).slice(-1)[0];
      const endDate = currentDateStr;

      const { data, error } = await supabase
        .from('habit_logs')
        .select('date,habit_id')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        const d = r.date as string;
        counts[d] = (counts[d] || 0) + 1;
      });

      const daysList = getLastNDays(days, new Date(currentDateStr)).reverse();
      const assembled = daysList.map((d) => ({ date: d, count: counts[d] || 0 }));
      setDbData(assembled);
    } catch (err: any) {
      setDbError(err?.message || String(err));
      setDbData([]);
    } finally {
      setLoadingDb(false);
    }
  };
  
  // Custom Tooltip for dark mode visual unity
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 dark:bg-slate-950 border border-slate-800 text-white p-3.5 rounded-xl shadow-lg text-xs space-y-1 backdrop-blur-xs font-mono">
          <p className="font-bold border-b border-slate-800 pb-1.5">{payload[0].name || payload[0].payload.name || 'Metrics'}</p>
          <p className="text-indigo-300">
            Value: <span className="text-white font-extrabold">{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 dark:bg-slate-950 border border-slate-800 text-white p-3 py-2 rounded-xl shadow-lg text-xs font-mono">
          <p className="font-bold">{payload[0].payload.name}</p>
          <p className="text-emerald-400">
            Completions: <span className="text-white font-extrabold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8" id="analytics_metrics_view">
      {/* View Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            Analytics Engine
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analyze historical routines, consistency ratios, and active weekday trends.
          </p>
        </div>

        {/* Time bounds filter */}
        <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-1">
          {([7, 14, 30] as const).map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeRange === days
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
        {/* DB Query Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDbDailyCounts(timeRange)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white"
          >
            Load DB Logs
          </button>
          <button
            onClick={async () => {
              try {
                await syncLocalDataToSupabase();
                // refresh DB view after sync
                await fetchDbDailyCounts(timeRange);
              } catch (err) {
                console.error('Sync failed from UI:', err);
              }
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white"
          >
            Push Local to DB
          </button>
          <span className="text-xxs text-slate-500">(fetches rows and optionally pushes local logs)</span>
        </div>
      </div>

      {/* Grid: Overview score, Pie (distribution), Weekly (Bar) */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Core Percentage Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
              Timeforce Streak
            </span>
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              {/* Custom SVG Circular Graphic */}
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  className="stroke-indigo-600 dark:stroke-indigo-400"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 60}
                  strokeDashoffset={2 * Math.PI * 60 * (1 - consistencyScore / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <h3 className="text-3xl font-black text-slate-900 dark:text-slate-50">
                  {consistencyScore}%
                </h3>
                <p className="text-xxs text-slate-500 font-bold uppercase tracking-wider mt-1">Consistency</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-2">
            <div className="flex justify-between">
              <span>Goal completions:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {activeHabits.reduce((acc, h) => acc + h.goal, 0) * timeRange} expected
              </span>
            </div>
            <div className="flex justify-between">
              <span>Active Target Routines:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {activeHabits.length}
              </span>
            </div>
          </div>
        </div>

        {/* Pie Chart Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xs flex flex-col justify-between col-span-1">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest pl-1 mb-2">
            Routine Completion Distribution
          </h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend indicator badges */}
          <div className="grid grid-cols-3 gap-2.5 text-xxs font-bold uppercase text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
            {pieData.map((item) => (
              <div key={item.name} className="flex flex-col items-center text-center">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name.replace(" Days", "")}</span>
                </div>
                <div className="text-slate-800 dark:text-slate-100 font-extrabold text-sm mt-1">{item.value}d</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekday Bar Chart Column */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4">
            Weekday Completions
          </h3>
          <div className="h-48 w-full font-mono text-xxs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F030" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8' }} />
                <YAxis hide={true} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#F1F5F910' }} />
                <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]}>
                  {weekdayData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.count === Math.max(...weekdayData.map(d => d.count)) ? '#10B981' : '#6366F1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xxs text-center text-slate-500 mt-2 font-medium">
            Visual representations of habit count per day of the week.
          </p>
        </div>
      </div>

      {/* GitHub-Style Habit Activity Heatmap (42 Days) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-xs">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <LucideIcon name="Calendar" className="text-indigo-500" />
            <span>Consistency Activity Grid (Last 6 Weeks)</span>
          </h3>
          <div className="flex items-center gap-1.5 text-xxs text-slate-400 font-bold">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-xs bg-slate-100 dark:bg-slate-850" />
            <div className="w-2.5 h-2.5 rounded-xs bg-indigo-500/20" />
            <div className="w-2.5 h-2.5 rounded-xs bg-indigo-500/50" />
            <div className="w-2.5 h-2.5 rounded-xs bg-indigo-500" />
            <div className="w-2.5 h-2.5 rounded-xs bg-indigo-700" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Layout Grid */}
        <div className="grid grid-cols-7 sm:grid-cols-14 md:grid-cols-21 gap-2 mx-auto overflow-x-auto justify-center md:justify-start" id="heatmap_grid">
          {heatmapDays.map((dateStr) => {
            const dayLogs = logs[dateStr] || {};
            const completedCount = activeHabits.filter((h) => dayLogs[h.id]).length;
            const completionRatio = activeHabits.length > 0 ? (completedCount / activeHabits.length) : 0;

            let intensityClass = 'bg-slate-100 dark:bg-slate-850 hover:ring-2 hover:ring-slate-400';
            let titleText = `${dateStr}: No habits tracked`;

            if (completedCount > 0) {
              titleText = `${dateStr}: ${completedCount}/${activeHabits.length} routines completed`;
              if (completionRatio === 1) {
                intensityClass = 'bg-indigo-700 text-white hover:ring-2 hover:ring-indigo-300';
              } else if (completionRatio >= 0.6) {
                intensityClass = 'bg-indigo-500 text-white hover:ring-2 hover:ring-indigo-300';
              } else if (completionRatio >= 0.3) {
                intensityClass = 'bg-indigo-500/50 text-white hover:ring-2 hover:ring-indigo-300';
              } else {
                intensityClass = 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 hover:ring-2 hover:ring-indigo-300';
              }
            }

            const parts = dateStr.split('-');
            const dateVal = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            const isToday = dateStr === currentDateStr;

            return (
              <div
                key={dateStr}
                className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-[10px] font-mono font-bold transition-all duration-200 cursor-help relative group ${intensityClass} ${
                  isToday ? 'ring-2 ring-emerald-500 border border-emerald-400' : ''
                }`}
                title={titleText}
              >
                <span>{dateVal.getDate()}</span>
                {/* Micro tooltip display on hover */}
                <div className="absolute bottom-full mb-2 bg-slate-900 border border-slate-800 text-white text-[9px] py-1 px-2 rounded-md translate-y-1 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 z-10 whitespace-nowrap">
                  {completedCount}/{activeHabits.length} Done ({Math.round(completionRatio * 100)}%)
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xxs text-slate-500 mt-4 text-center sm:text-left font-semibold">
          * Grid representing day completion scores backwards from current date. Double border marks current date block.
        </p>
      </div>

      {/* Line Chart Trend (30 Days) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-xs">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest pl-1 mb-6 flex items-center gap-2">
          <LucideIcon name="TrendingUp" className="text-emerald-500" />
          <span>Consistency Trend (30-day timeline)</span>
        </h3>
        <div className="h-60 w-full font-mono text-xxs">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F030" />
              <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8' }} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="rate"
                name="Daily Completion Rate"
                stroke="#6366F1"
                strokeWidth={3}
                dot={{ r: 3, stroke: '#6366F1', strokeWidth: 1, fill: '#FFFFFF' }}
                activeDot={{ r: 6, fill: '#6366F1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Raw DB-backed daily counts (if fetched) */}
      {dbData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-xs">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4">DB-backed Daily Completions</h3>
          {loadingDb && <div className="text-xxs text-slate-500">Loading…</div>}
          {dbError && <div className="text-xxs text-rose-500">Error: {dbError}</div>}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xxs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-extrabold uppercase tracking-widest">
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Completions</th>
                </tr>
              </thead>
              <tbody>
                {dbData.map((row) => (
                  <tr key={row.date} className="border-b border-slate-50 dark:border-slate-850">
                    <td className="py-2 px-2 font-mono">{row.date}</td>
                    <td className="py-2 px-2 font-extrabold">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Sync status */}
      <div className="text-xxs mt-2">
        {isSyncing && <div className="text-slate-500">Syncing to Supabase…</div>}
        {syncSuccessMessage && <div className="text-emerald-500">{syncSuccessMessage}</div>}
        {storeError && <div className="text-rose-500">{storeError}</div>}
      </div>

      {/* Routine Specific Habit Efficacy Tables */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-xs">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest pl-1 mb-4 flex items-center gap-2">
          <LucideIcon name="Award" className="text-amber-500" />
          <span>Routine Consistency Breakdown</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 text-xxs font-extrabold uppercase tracking-widest">
                <th className="py-3 px-2">Routine</th>
                <th className="py-3 px-2">Category</th>
                <th className="py-3 px-2">Logged Successes</th>
                <th className="py-3 px-2">Completion Rate</th>
                <th className="py-3 px-2 text-right">Routine Power</th>
              </tr>
            </thead>
            <tbody>
              {efficiencyList.map(({ habit, rate, completedCount }) => (
                <tr key={habit.id} className="border-b border-slate-55 dark:border-slate-850 text-slate-800 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition">
                  <td className="py-3.5 px-2 flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg text-white" style={{ backgroundColor: habit.color }}>
                      <LucideIcon name={habit.icon} size={14} />
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white">{habit.name}</span>
                  </td>
                  <td className="py-3.5 px-2">
                    <span className="px-2 py-0.5 text-xxs rounded-full" style={{ backgroundColor: `${habit.color}15`, color: habit.color }}>
                      {habit.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400">{completedCount} times done</td>
                  <td className="py-3.5 px-2 font-mono">{rate}%</td>
                  <td className="py-3.5 px-2 text-right">
                    <span className={`text-xxs px-2 py-0.5 rounded-full font-bold ${
                      rate >= 80 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' :
                      rate >= 50 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' :
                      'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450'
                    }`}>
                      {rate >= 80 ? 'Mastery 🔥' : rate >= 50 ? 'Consistency 👍' : 'Needs Focus 💡'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
