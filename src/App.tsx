import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Dumbbell,
  BarChart2,
  Calendar,
  FileSpreadsheet,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  Search as SearchIcon,
} from 'lucide-react';

import { Habit, HabitLogs } from './types';
import { formatDate } from './utils/habitUtils';
import { useHabitStore } from './store/useHabitStore';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';

// View components
import { DashboardView } from './components/DashboardView';
import { HabitsView } from './components/HabitsView';
import { AnalyticsView } from './components/AnalyticsView';
import { CalendarView } from './components/CalendarView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';

export default function App() {
  const {
    habits,
    logs,
    theme,
    activeTab,
    searchQuery,
    loading,
    error,
    supabaseConfigured,
    syncSuccessMessage,
    initialize,
    setTheme,
    setActiveTab,
    setSearchQuery,
    toggleHabit,
    createHabit,
    editHabit,
    deleteHabit,
    archiveHabit,
    restoreHabit,
    resetData,
    syncLocalDataToSupabase
  } = useHabitStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentDateStr = formatDate(new Date());

  useEffect(() => {
    initialize();
  }, []);

  // ── Backup export (JSON download from in-memory data) ──────────────────────
  const handleBackupExport = () => {
    const backupPayload = {
      habits,
      logs,
      version: '1.0.0',
      exportedAt: new Date().toISOString()
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `habitflow-backup-${currentDateStr}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // ── Import: push JSON backup directly into Supabase ───────────────────────
  const handleDataImport = async (importedData: { habits: Habit[]; logs: HabitLogs }) => {
    if (!isSupabaseConfigured || !supabase) {
      useHabitStore.setState({ error: 'Supabase not configured — cannot import data.' });
      return;
    }

    useHabitStore.setState({ loading: true, error: null });
    try {
      // Clear existing cloud data
      await supabase.from('habit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('habits').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Insert imported habits
      for (const h of importedData.habits) {
        await supabase.from('habits').insert({
          id: h.id,
          name: h.name,
          description: h.description,
          category: h.category,
          color: h.color,
          icon: h.icon,
          frequency: h.frequency,
          goal: h.goal,
          start_date: h.startDate,
          created_at: h.createdAt,
          archived: h.archived,
        });
      }

      // Insert imported logs
      const insertableLogs: any[] = [];
      Object.keys(importedData.logs).forEach((dateStr) => {
        Object.keys(importedData.logs[dateStr]).forEach((habitId) => {
          if (importedData.logs[dateStr][habitId]) {
            insertableLogs.push({
              habit_id: habitId,
              completed_date: dateStr,
              status: 'completed',
              created_at: new Date().toISOString(),
            });
          }
        });
      });

      if (insertableLogs.length > 0) {
        await supabase.from('habit_logs').insert(insertableLogs);
      }

      // Reload from DB
      await initialize();
    } catch (err: any) {
      useHabitStore.setState({ loading: false, error: `Import failed: ${err.message}` });
    }
  };

  const getDisplayDateHeader = () => {
    const [y, m, d] = currentDateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'habits', label: 'Habit Routines', icon: Dumbbell },
    { id: 'analytics', label: 'Analytics Engine', icon: BarChart2 },
    { id: 'calendar', label: 'Calendar Logs', icon: Calendar },
    { id: 'reports', label: 'Executive Reports', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className={`min-h-screen font-sans ${
      theme === 'dark'
        ? 'bg-[#0F172A] text-[#F8FAFC]'
        : 'bg-[#F8FAFC] text-[#0F172A]'
    } flex`}>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/50 dark:border-slate-800 bg-white/70 dark:bg-[#0F172A] shrink-0 p-6 space-y-8 no-print">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-indigo-500/20">
            NS
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight dark:text-white leading-none"> HabbitFlow</h2>
            <span className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-widest mt-0.5 inline-block">Let's Do IT</span>
          </div>
        </div>

        <nav className="space-y-1.5 flex-1 select-none">
          {menuItems.map((item) => {
            const IconComp = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 scale-102 font-extrabold'
                    : 'text-slate-505 dark:text-slate-400 hover:bg-slate-55 dark:hover:bg-slate-950 hover:text-slate-950 dark:hover:text-slate-100'
                }`}
              >
                <IconComp className="w-4.5 h-4.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="text-[10px] text-slate-400 font-mono text-center">
          Sivanji's HabbitFlow • V1.0.1
        </div>
      </aside>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex no-print">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between h-full z-10"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm">HF</div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-50 text-sm">Sivanji's HabbitFlow</h3>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                            : 'text-slate-500 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-805 hover:text-slate-900'
                        }`}
                      >
                        <IconComp className="w-4.5 h-4.5 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
              <div className="text-[10px] text-slate-450 font-mono text-center">Sivanji's HabbitFlow • V1.0.0</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-slate-200/50 dark:border-slate-800 bg-white/40 dark:bg-[#0F172A]/80 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-30 no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1E293B] transition cursor-pointer"
            >
              <Menu size={18} />
            </button>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider hidden sm:block">
                {getDisplayDateHeader()}
              </p>
              <h2 className="text-sm font-bold text-slate-850 dark:text-white sm:mt-0.5 capitalize">
                 {activeTab.replace('_', ' ')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative max-w-xs hidden sm:block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon size={14} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Lookup routine records..."
                className="w-48 focus:w-60 bg-slate-50 dark:bg-[#1E293B] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-400 transition-all outline-none"
              />
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:text-indigo-600 dark:hover:text-indigo-400 transition font-bold cursor-pointer"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>

          {/* Supabase status pill */}
          {supabaseConfigured ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 no-print" title="Supabase connected">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider hidden sm:block">Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.0 px-2.0 py-1.0 rounded-xl bg-red-500/10 border border-red-500/20 no-print" title="Supabase not connected">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider hidden sm:block">Not Connected</span>
            </div>
          )}

        </header>

        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {/* Error banner */}
          {error && (
            <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex justify-between items-center no-print">
              <span>⚠️ {error}</span>
              <button onClick={() => useHabitStore.setState({ error: null })} className="text-[10px] uppercase font-bold hover:underline">Dismiss</button>
            </div>
          )}

          {/* Sync success banner */}
          {syncSuccessMessage && (
            <div className="mb-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex justify-between items-center no-print">
              <span>✅ {syncSuccessMessage}</span>
              <button onClick={() => useHabitStore.setState({ syncSuccessMessage: null })} className="text-[10px] uppercase font-bold hover:underline">Dismiss</button>
            </div>
          )}

          {/* Supabase live badge */}
          {/* {supabaseConfigured && (
            <div className="mb-4 flex items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 font-medium no-print">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 animate-bounce" />
                 <span>Supabase Live Cloud Synchronization active</span>
              </div>
              <div className="text-xxs uppercase tracking-wider font-bold bg-emerald-500/15 px-2.5 py-1 rounded-lg">LIVE</div>
            </div>
          )} */}

          {/* Not configured warning */}
          {!supabaseConfigured && (
            <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs no-print">
              <strong>⛔ Supabase not configured.</strong> Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> file and restart the dev server.
            </div>
          )}

          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-400 font-medium">Loading from Supabase...</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {activeTab === 'dashboard' && (
                  <DashboardView
                    habits={habits}
                    logs={logs}
                    onToggleHabit={toggleHabit}
                    searchQuery={searchQuery}
                    onNavigate={setActiveTab}
                    currentDateStr={currentDateStr}
                  />
                )}
                {activeTab === 'habits' && (
                  <HabitsView
                    habits={habits}
                    onCreateHabit={createHabit}
                    onEditHabit={editHabit}
                    onDeleteHabit={deleteHabit}
                    onArchiveHabit={archiveHabit}
                    onRestoreHabit={restoreHabit}
                  />
                )}
                {activeTab === 'analytics' && (
                  <AnalyticsView habits={habits} logs={logs} currentDateStr={currentDateStr} />
                )}
                {activeTab === 'calendar' && (
                  <CalendarView habits={habits} logs={logs} onToggleHabit={toggleHabit} currentDateStr={currentDateStr} />
                )}
                {activeTab === 'reports' && (
                  <ReportsView habits={habits} logs={logs} currentDateStr={currentDateStr} />
                )}
                {activeTab === 'settings' && (
                  <SettingsView
                    theme={theme}
                    onThemeToggle={(nextTheme) => setTheme(nextTheme)}
                    onBackupExport={handleBackupExport}
                    onDataImport={handleDataImport}
                    onResetData={resetData}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}
