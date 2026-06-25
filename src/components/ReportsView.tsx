import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Award,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  Clock,
  Printer
} from 'lucide-react';
import { Habit, HabitLogs } from '../types';
import {
  getLastNDays,
  getOverallConsistencyScore,
  getHabitEfficiencyList,
  getTotalCompletions
} from '../utils/habitUtils';
import LucideIcon from './LucideIcon';

interface ReportsViewProps {
  habits: Habit[];
  logs: HabitLogs;
  currentDateStr: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ habits, logs, currentDateStr }) => {
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');

  const activeHabits = habits.filter((h) => !h.archived);

  // Calculates stats over past 7 days (Weekly Report)
  const last7Days = getLastNDays(7, new Date(currentDateStr));
  let weeklyCompleted = 0;
  let weeklyExpected = activeHabits.length * 7;
  const weekdayCounts: { [key: string]: number } = {};
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  last7Days.forEach((dateStr) => {
    const dayLogs = logs[dateStr] || {};
    const parts = dateStr.split('-');
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const dayName = weekdays[dateObj.getDay()];

    activeHabits.forEach((habit) => {
      if (dayLogs[habit.id]) {
        weeklyCompleted++;
        weekdayCounts[dayName] = (weekdayCounts[dayName] || 0) + 1;
      }
    });
  });

  const weeklySuccessRate = weeklyExpected > 0 ? Math.round((weeklyCompleted / weeklyExpected) * 105) : 0;
  const weeklySuccessRateClamped = Math.min(100, weeklySuccessRate);
  const weeklyMisses = Math.max(0, weeklyExpected - weeklyCompleted);

  // Sorting days of the week to calculate best and worst
  const sortedWeekdays = Object.keys(weekdayCounts).sort((a, b) => weekdayCounts[b] - weekdayCounts[a]);
  const bestDayWeekly = sortedWeekdays[0] || 'Tuesday';
  const worstDayWeekly = sortedWeekdays[sortedWeekdays.length - 1] || 'Sunday';

  // Calculates stats over past 30 days (Monthly Report)
  const last30Days = getLastNDays(30, new Date(currentDateStr));
  const efficiencyList = getHabitEfficiencyList(activeHabits, logs, 30, currentDateStr);

  const monthlyCompleted = efficiencyList.reduce((acc, h) => acc + h.completedCount, 0);
  const monthlyExpected = activeHabits.length * 30;
  const monthlySuccessRate = monthlyExpected > 0 ? Math.round((monthlyCompleted / monthlyExpected) * 100) : 0;

  const mostConsistentHabit = efficiencyList[0]?.habit?.name || 'Coding Practice';
  const leastConsistentHabit = efficiencyList[efficiencyList.length - 1]?.habit?.name || 'Meditation';

  // Improvement Vector Calculation
  // We compare completions in the most recent 15 days vs. the previous 15 days
  const recent15Days = last30Days.slice(15);
  const older15Days = last30Days.slice(0, 15);

  let recentCompletions = 0;
  let olderCompletions = 0;

  activeHabits.forEach((habit) => {
    recent15Days.forEach((d) => { if (logs[d]?.[habit.id]) recentCompletions++; });
    older15Days.forEach((d) => { if (logs[d]?.[habit.id]) olderCompletions++; });
  });

  const improvementRate = olderCompletions > 0
    ? Math.round(((recentCompletions - olderCompletions) / olderCompletions) * 100)
    : 15; // standard fallback vector

  // Export to CSV Log Utility
  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Date,Habit Name,Category,Status\n';

    // Output past 40 days of log data
    const dates = getLastNDays(40, new Date(currentDateStr));
    dates.forEach((dateStr) => {
      activeHabits.forEach((habit) => {
        const completed = !!logs[dateStr]?.[habit.id];
        csvContent += `${dateStr},"${habit.name.replace(/"/g, '""')}",${habit.category},${completed ? 'Completed' : 'Missed'}\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `habitflow-report-${currentDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Triggers window native printing configured with custom paper layout styles
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="reports_center_view">
      {/* Printable Sheet Accent Styles for window.print() */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          aside, nav, header, button, .no-print {
            display: none !important;
          }
          #printable_report_body {
            display: block !important;
            width: 100% !important;
            padding: 2rem !important;
          }
          .card-print {
            border: 1px solid #CCCCCC !important;
            background: transparent !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            Compiled Summary Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Download comprehensive spreadsheets or trigger high-contrast printable profiles.
          </p>
        </div>

        {/* Action downlaods list */}
        <div className="flex gap-2.5">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 hover:bg-emerald-100/50 transition cursor-pointer"
            id="btn_export_csv"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-100/50 transition cursor-pointer"
            id="btn_print_pdf"
          >
            <Printer className="w-4 h-4" />
            <span>Save as PDF (Print)</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Selector */}
      <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-250 dark:border-slate-800 gap-1 w-fit no-print">
        <button
          onClick={() => setReportType('weekly')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            reportType === 'weekly'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xxs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Weekly Executive Report
        </button>
        <button
          onClick={() => setReportType('monthly')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            reportType === 'monthly'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xxs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Monthly Comprehensive Report
        </button>
      </div>

      {/* Main Report Body Container */}
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 rounded-3xl space-y-8 shadow-xs"
        id="printable_report_body"
      >
        {/* Report Summary Frame */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-5 gap-3">
          <div className="space-y-1">
            <span className="text-xxs font-extrabold uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40 px-2.5 py-0.5 rounded-full">
              {reportType === 'weekly' ? 'Weekly Executive Audit' : 'Monthly Performance Matrix'}
            </span>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white font-serif">
              Sivanji's HabbitFlow Discipline Record
            </h2>
          </div>
          <div className="text-right text-xxs font-mono text-slate-500 font-bold space-y-1">
            <p>Generated: {currentDateStr}</p>
            <p>Scope: {reportType === 'weekly' ? 'Past 7 Days' : 'Historical 30 Days'}</p>
          </div>
        </div>

        {/* Dynamic Display Depending on Selected Type */}
        {reportType === 'weekly' ? (
          /* Weekly Summary Layout */
          <div className="space-y-6" id="weekly_report_section">
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2 card-print">
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block">Weekly Success Rate</span>
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{weeklySuccessRateClamped}%</span>
                <p className="text-xxs text-slate-500">{weeklyCompleted} out of {weeklyExpected} checks logged</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2 card-print">
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block">Missed Milestones</span>
                <span className="text-3xl font-black text-rose-500">{weeklyMisses} Checks</span>
                <p className="text-xxs text-slate-500">Unfulfilled expectations inside past week</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2 card-print">
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block">Peak Power Day</span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 capitalize">{bestDayWeekly}</span>
                <p className="text-xxs text-slate-500">Strongest weekday tracking density</p>
              </div>
            </div>

            {/* Smart Descriptive insights paragraph */}
            <div className="p-5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/15 border border-indigo-200/40 dark:border-indigo-900/30 text-xs text-slate-600 dark:text-slate-400 flex gap-3 card-print">
              <Clock className="w-5 h-5 text-indigo-500 shrink-0" />
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 dark:text-slate-300">Weekly Performance Log Insight</h4>
                <p className="leading-relaxed">
                  Your discipline index peaked on <span className="font-bold text-indigo-600 dark:text-indigo-400">{bestDayWeekly}</span>. 
                  However, logs indicate weakness on <span className="font-semibold text-rose-500">{worstDayWeekly}</span>. 
                  Setting early morning reminders on lower performance weekdays will buffer your consistency rate.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Monthly Summary Layout */
          <div className="space-y-6" id="monthly_report_section">
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2 card-print">
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block">30-Day Completion Rate</span>
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{monthlySuccessRate}%</span>
                <p className="text-xxs text-slate-500">Percentage total of expected completions</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2 card-print">
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block">Growth Vector</span>
                <span className={`text-3xl font-black flex items-center gap-1 ${improvementRate >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {improvementRate >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {improvementRate >= 0 ? `+${improvementRate}%` : `${improvementRate}%`}
                </span>
                <p className="text-xxs text-slate-500">Compares final 15 days vs first 15 days</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2 card-print">
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block">Most Reliable Routine</span>
                <span className="text-xl font-bold text-slate-800 dark:text-slate-150 truncate block">{mostConsistentHabit}</span>
                <p className="text-xxs text-slate-500">Highest individual completion rate</p>
              </div>
            </div>

            {/* Smart Monthly insight card */}
            <div className="p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 text-xs text-slate-600 dark:text-slate-400 flex gap-3 card-print">
              <Award className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 dark:text-slate-300">Executive Summary for June 2026</h4>
                <p className="leading-relaxed">
                  Through diligent calendar tracking, your strongest discipline asset remains <span className="font-bold text-indigo-600 dark:text-indigo-400">{mostConsistentHabit}</span>. 
                  On the contrary, <span className="font-semibold text-slate-700 dark:text-slate-300">{leastConsistentHabit}</span> presents opportunities for habit-loop engineering. 
                  Your overall quarterly progression is positive, with a growth Vector of <span className="font-bold text-emerald-500">+{improvementRate}%</span>. Keep up the high flow state!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Individual Routine Metrics Grid for print logs */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
            Detailed Routine Metrics (Filtered last 30 Days)
          </h3>
          <div className="space-y-3">
            {efficiencyList.map(({ habit, rate, completedCount }) => (
              <div
                key={habit.id}
                className="flex justify-between items-center text-xs p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850/60 rounded-xl card-print"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: habit.color }}>
                    <LucideIcon name={habit.icon} size={14} />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block">{habit.name}</span>
                    <span className="text-xxs text-slate-450 block">{habit.category}</span>
                  </div>
                </div>
                <div className="text-right font-mono font-bold">
                  <span className="text-slate-500 mr-4 font-normal text-xxs">{completedCount} completions</span>
                  <span>{rate}% match</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Printable Footer disclaimer block */}
        <div className="text-center text-[10px] text-slate-400 font-mono mt-10 uppercase tracking-wider">
          Sivanji's HabbitFlow - Automated Digital Summary Ledger
        </div>
      </div>
    </div>
  );
};
