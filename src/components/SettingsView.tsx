import React, { useRef, useState } from 'react';
import {
  Moon,
  Sun,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { Habit, HabitLogs } from '../types';
import { useHabitStore } from '../store/useHabitStore';

interface SettingsViewProps {
  theme: 'dark' | 'light';
  onThemeToggle: (nextTheme: 'dark' | 'light') => void;
  onBackupExport: () => void;
  onDataImport: (importedData: { habits: Habit[]; logs: HabitLogs }) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onThemeToggle,
  onBackupExport,
  onDataImport,
  onResetData
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const isSyncing = useHabitStore((s) => s.isSyncing);
  const syncSuccessMessage = useHabitStore((s) => s.syncSuccessMessage);
  const supabaseConfigured = useHabitStore((s) => s.supabaseConfigured);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.habits)) {
          onDataImport({ habits: parsed.habits, logs: parsed.logs || {} });
          setImportStatus({ type: 'success', message: 'Backup uploaded to Supabase successfully!' });
        } else {
          throw new Error('Invalid JSON schema.');
        }
      } catch {
        setImportStatus({ type: 'error', message: 'Failed to import backup: invalid or corrupted file.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6" id="settings_control_view">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
          <Settings className="text-indigo-500" />
          <span>System Settings</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage theme, backup/restore data, and control Supabase cloud sync.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Theme */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-xxs">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
            Branding & Themes
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Theme preference is saved to Supabase and synced across sessions.
          </p>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl">
            <div className="flex items-center gap-2.5">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-indigo-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                Selected: {theme === 'dark' ? 'Classic Dark Mode' : 'Clean Light Mode'}
              </span>
            </div>
            <button
              onClick={() => onThemeToggle(theme === 'dark' ? 'light' : 'dark')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer transition active:scale-95"
            >
              Toggle Light/Dark
            </button>
          </div>

          {/* Interview Prep Link */}
          <a
            href="https://sivanji05.github.io/Interview-prep/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 transition group"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <div>
                <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">Interview Prep</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">sivanji05.github.io/Interview-prep</p>
              </div>
            </div>
            <span className="text-indigo-400 group-hover:translate-x-1 transition-transform text-sm">→</span>
          </a>
        </div>

        {/* Backup Export/Import */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-xxs">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
            Information Backups
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export current data as JSON. Importing will push the backup directly to Supabase — no local storage used.
          </p>

          <div className="grid grid-cols-2 gap-3 pb-2">
            <button
              onClick={onBackupExport}
              className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-2xl gap-2 cursor-pointer group hover:border-indigo-500 transition-all text-center"
            >
              <Download className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Export Backup</span>
              <span className="text-[10px] text-slate-400 font-medium">Download JSON</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-2xl gap-2 cursor-pointer group hover:border-indigo-500 transition-all text-center"
            >
              <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload Backup</span>
              <span className="text-[10px] text-slate-400 font-medium">Push to Supabase</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
          </div>

          {importStatus.type !== 'idle' && (
            <div className={`p-4 rounded-xl text-xs flex gap-2 border font-medium ${
              importStatus.type === 'success'
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-600 dark:text-emerald-450'
                : 'bg-red-50/50 dark:bg-red-950/20 border-red-500/20 text-red-650 dark:text-red-400'
            }`}>
              {importStatus.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>

        {/* Supabase Cloud Integration */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-xxs">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50 border-b border-slate-100 dark:border-slate-800/80 pb-2.5 flex items-center gap-2">
            <span>Supabase Cloud Integration</span>
            {supabaseConfigured ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-red-500" />
            )}
          </h2>

          <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-200/15 text-xs text-slate-600 dark:text-slate-400 space-y-3">
            <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850 font-bold">
              <span className="text-slate-500 dark:text-slate-400">Connection Status:</span>
              {supabaseConfigured ? (
                <span className="text-emerald-500 font-extrabold">CONNECTED & LIVE</span>
              ) : (
                <span className="text-red-500 font-extrabold">NOT CONFIGURED</span>
              )}
            </div>

            {supabaseConfigured ? (
              <div className="space-y-3">
                <p className="leading-relaxed text-[11px]">
                  All habit CRUD operations, completions, and theme settings sync to Supabase in real-time. No local storage is used.
                </p>

                <button
                  onClick={() => useHabitStore.getState().syncLocalDataToSupabase()}
                  disabled={isSyncing}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition active:scale-95 disabled:opacity-50"
                >
                  {isSyncing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Refreshing from Supabase...</span>
                    </>
                  ) : (
                    <span>↻ Refresh Data from Supabase</span>
                  )}
                </button>

                {syncSuccessMessage && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-[11px] font-medium text-center">
                    ✓ {syncSuccessMessage}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-[11px] leading-relaxed">
                <p>Set these variables in your <code>.env</code> file and restart the dev server:</p>
                <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl font-mono border border-slate-100 dark:border-slate-850/80 space-y-1">
                  <div className="text-indigo-400">VITE_SUPABASE_URL=https://xxx.supabase.co</div>
                  <div className="text-indigo-400">VITE_SUPABASE_ANON_KEY=your_anon_key</div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 space-y-2">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 block text-xs">🚀 Supabase SQL Schema</span>
                  <textarea
                    readOnly
                    onClick={(e) => {
                      (e.target as HTMLTextAreaElement).select();
                      navigator.clipboard.writeText((e.target as HTMLTextAreaElement).value);
                    }}
                    value={`-- 1. Habits table
create table habits (
  id text primary key,
  name text not null,
  description text,
  category text default 'Custom',
  color text,
  icon text,
  frequency text default 'daily',
  goal integer default 1,
  start_date text,
  created_at timestamptz default now(),
  archived boolean default false
);

-- 2. Habit completion logs
create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id text references habits(id) on delete cascade not null,
  completed_date text not null,
  status text default 'completed',
  created_at timestamptz default now()
);

-- 3. Settings (theme etc)
create table settings (
  id uuid primary key default gen_random_uuid(),
  theme text default 'dark' not null,
  created_at timestamptz default now()
);

-- 4. Enable Row Level Security (RLS) - allow all for anon
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table settings enable row level security;

create policy "allow all" on habits for all using (true) with check (true);
create policy "allow all" on habit_logs for all using (true) with check (true);
create policy "allow all" on settings for all using (true) with check (true);`}
                    className="w-full h-48 text-[10px] p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/30 text-slate-500 select-all cursor-pointer"
                    title="Click to select & copy"
                  />
                  <div className="text-[9px] text-slate-500 text-right italic font-medium">
                    Click script to select & copy to clipboard
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 p-6 rounded-3xl space-y-4 hover:border-red-500/20 transition shadow-xxs">
          <h2 className="text-base font-extrabold text-rose-600 dark:text-rose-450 border-b border-slate-100 dark:border-slate-800/80 pb-2.5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" /> Danger Protocols
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hard reset deletes all habits and logs from Supabase and loads fresh starter habits.
          </p>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-600 border border-rose-500/20 cursor-pointer transition"
            >
              Hard Reset Database
            </button>
          ) : (
            <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/30 text-xs space-y-3">
              <span className="font-extrabold text-red-500 block">Are you absolutely sure? This deletes all Supabase data!</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-205 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onResetData();
                    setShowResetConfirm(false);
                    setImportStatus({ type: 'success', message: 'Supabase wiped. Fresh starter habits loaded!' });
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 font-bold text-white transition cursor-pointer"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
