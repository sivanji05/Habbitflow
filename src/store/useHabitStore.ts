import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Habit, HabitLogs, HabitCategory } from '../types';
import { STARTER_HABITS } from '../data/defaultData';

export interface HabitStore {
  habits: Habit[];
  logs: HabitLogs;
  theme: 'dark' | 'light';
  activeTab: 'dashboard' | 'habits' | 'analytics' | 'calendar' | 'reports' | 'settings';
  searchQuery: string;
  loading: boolean;
  error: string | null;
  supabaseConfigured: boolean;
  isSyncing: boolean;
  syncSuccessMessage: string | null;

  // Actions
  initialize: () => Promise<void>;
  setTheme: (theme: 'dark' | 'light') => void;
  setActiveTab: (tab: HabitStore['activeTab']) => void;
  setSearchQuery: (query: string) => void;

  // CRUD
  toggleHabit: (habitId: string, dateStr: string) => Promise<void>;
  createHabit: (newHabitData: Omit<Habit, 'id' | 'createdAt'>) => Promise<void>;
  editHabit: (id: string, updatedFields: Omit<Habit, 'id' | 'createdAt'>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  restoreHabit: (id: string) => Promise<void>;
  resetData: () => Promise<void>;
  syncLocalDataToSupabase: () => Promise<void>;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function applyThemeClass(theme: 'dark' | 'light') {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

// ─── store ────────────────────────────────────────────────────────────────────

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  logs: {},
  theme: 'dark',
  activeTab: 'dashboard',
  searchQuery: '',
  loading: true,
  error: null,
  supabaseConfigured: isSupabaseConfigured,
  isSyncing: false,
  syncSuccessMessage: null,

  // ── initialize ──────────────────────────────────────────────────────────────
  initialize: async () => {
    set({ loading: true, error: null });

    if (!isSupabaseConfigured || !supabase) {
      set({
        loading: false,
        error: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.',
      });
      return;
    }

    try {
      // ── habits ──
      const { data: dbHabits, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: true });

      if (habitsError) throw habitsError;

      // ── logs ──
      const { data: dbLogs, error: logsError } = await supabase
        .from('habit_logs')
        .select('*');

      if (logsError) throw logsError;

      // ── settings (theme) ──
      const { data: dbSettings } = await supabase
        .from('settings')
        .select('*')
        .limit(1);

      // Map snake_case → camelCase
      const mappedHabits: Habit[] = (dbHabits ?? []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        category: (item.category || 'Custom') as HabitCategory,
        color: item.color || '#6366F1',
        icon: item.icon || 'Sparkles',
        frequency: (item.frequency || 'daily') as 'daily' | 'weekly',
        goal: item.goal || 1,
        startDate: item.start_date || new Date().toISOString().slice(0, 10),
        archived: item.archived || false,
        createdAt: item.created_at || new Date().toISOString(),
      }));

      // Flat log rows → { [date]: { [habitId]: true } }
      const mappedLogs: HabitLogs = {};
      (dbLogs ?? []).forEach((log: any) => {
        const { completed_date: dateStr, habit_id: habitId } = log;
        if (dateStr && habitId) {
          if (!mappedLogs[dateStr]) mappedLogs[dateStr] = {};
          mappedLogs[dateStr][habitId] = true;
        }
      });

      // Apply theme from DB
      let resolvedTheme: 'dark' | 'light' = 'dark';
      if (dbSettings && dbSettings.length > 0) {
        const t = dbSettings[0].theme;
        if (t === 'dark' || t === 'light') resolvedTheme = t;
      }
      applyThemeClass(resolvedTheme);

      set({ habits: mappedHabits, logs: mappedLogs, theme: resolvedTheme, loading: false });
    } catch (err: any) {
      console.error('[HabitFlow] initialize error:', err);
      set({
        loading: false,
        error: `Failed to load from Supabase: ${err.message}. Check your DB tables and keys.`,
      });
    }
  },

  // ── setTheme ─────────────────────────────────────────────────────────────────
  setTheme: async (newTheme) => {
    set({ theme: newTheme });
    applyThemeClass(newTheme);

    if (!isSupabaseConfigured || !supabase) return;

    try {
      const { data } = await supabase.from('settings').select('id').limit(1);
      if (data && data.length > 0) {
        await supabase.from('settings').update({ theme: newTheme }).eq('id', data[0].id);
      } else {
        await supabase.from('settings').insert({ theme: newTheme });
      }
    } catch (err) {
      console.error('[HabitFlow] setTheme sync error:', err);
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // ── toggleHabit ──────────────────────────────────────────────────────────────
  toggleHabit: async (habitId, dateStr) => {
    if (!isSupabaseConfigured || !supabase) {
      set({ error: 'Supabase not configured — cannot save habit completion.' });
      return;
    }

    const { logs } = get();
    const isCurrentlyCompleted = !!(logs[dateStr]?.[habitId]);

    // Optimistic UI update (in-memory only)
    const updatedLogs: HabitLogs = {
      ...logs,
      [dateStr]: { ...(logs[dateStr] || {}), [habitId]: !isCurrentlyCompleted },
    };
    set({ logs: updatedLogs });

    try {
      if (!isCurrentlyCompleted) {
        const { error } = await supabase.from('habit_logs').insert({
          habit_id: habitId,
          completed_date: dateStr,
          status: 'completed',
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('completed_date', dateStr);
        if (error) throw error;
      }
    } catch (err: any) {
      console.error('[HabitFlow] toggleHabit error:', err);
      // Rollback optimistic update
      set({ logs, error: `Failed to save completion: ${err.message}` });
    }
  },

  // ── createHabit ──────────────────────────────────────────────────────────────
  createHabit: async (newHabitData) => {
    if (!isSupabaseConfigured || !supabase) {
      set({ error: 'Supabase not configured — cannot create habit.' });
      return;
    }

    const uniqueId = `h_${Date.now()}`;
    const newHabit: Habit = {
      ...newHabitData,
      id: uniqueId,
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI
    set((state) => ({ habits: [...state.habits, newHabit] }));

    try {
      const { error } = await supabase.from('habits').insert({
        id: newHabit.id,
        name: newHabit.name,
        description: newHabit.description,
        category: newHabit.category,
        color: newHabit.color,
        icon: newHabit.icon,
        frequency: newHabit.frequency,
        goal: newHabit.goal,
        start_date: newHabit.startDate,
        created_at: newHabit.createdAt,
        archived: newHabit.archived,
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('[HabitFlow] createHabit error:', err);
      // Rollback
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== uniqueId),
        error: `Failed to create habit: ${err.message}`,
      }));
    }
  },

  // ── editHabit ────────────────────────────────────────────────────────────────
  editHabit: async (id, updatedFields) => {
    if (!isSupabaseConfigured || !supabase) {
      set({ error: 'Supabase not configured — cannot update habit.' });
      return;
    }

    const prevHabits = get().habits;
    const updatedHabits = prevHabits.map((h) =>
      h.id === id ? { ...h, ...updatedFields } : h
    );
    set({ habits: updatedHabits });

    try {
      const { error } = await supabase
        .from('habits')
        .update({
          name: updatedFields.name,
          description: updatedFields.description,
          category: updatedFields.category,
          color: updatedFields.color,
          icon: updatedFields.icon,
          frequency: updatedFields.frequency,
          goal: updatedFields.goal,
          start_date: updatedFields.startDate,
          archived: updatedFields.archived,
        })
        .eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.error('[HabitFlow] editHabit error:', err);
      set({ habits: prevHabits, error: `Failed to update habit: ${err.message}` });
    }
  },

  // ── deleteHabit ──────────────────────────────────────────────────────────────
  deleteHabit: async (id) => {
    if (!isSupabaseConfigured || !supabase) {
      set({ error: 'Supabase not configured — cannot delete habit.' });
      return;
    }

    const { habits, logs } = get();
    const updatedHabits = habits.filter((h) => h.id !== id);

    // Remove from in-memory logs too
    const updatedLogs = { ...logs };
    Object.keys(updatedLogs).forEach((dateKey) => {
      if (updatedLogs[dateKey]?.[id] !== undefined) {
        const cleanedDay = { ...updatedLogs[dateKey] };
        delete cleanedDay[id];
        updatedLogs[dateKey] = cleanedDay;
      }
    });

    set({ habits: updatedHabits, logs: updatedLogs });

    try {
      // Delete logs first (FK integrity)
      await supabase.from('habit_logs').delete().eq('habit_id', id);
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.error('[HabitFlow] deleteHabit error:', err);
      set({ habits, logs, error: `Failed to delete habit: ${err.message}` });
    }
  },

  // ── archiveHabit ─────────────────────────────────────────────────────────────
  archiveHabit: async (id) => {
    if (!isSupabaseConfigured || !supabase) {
      set({ error: 'Supabase not configured — cannot archive habit.' });
      return;
    }

    const prevHabits = get().habits;
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, archived: true } : h)),
    }));

    try {
      const { error } = await supabase.from('habits').update({ archived: true }).eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      set({ habits: prevHabits, error: `Failed to archive: ${err.message}` });
    }
  },

  // ── restoreHabit ─────────────────────────────────────────────────────────────
  restoreHabit: async (id) => {
    if (!isSupabaseConfigured || !supabase) {
      set({ error: 'Supabase not configured — cannot restore habit.' });
      return;
    }

    const prevHabits = get().habits;
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, archived: false } : h)),
    }));

    try {
      const { error } = await supabase.from('habits').update({ archived: false }).eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      set({ habits: prevHabits, error: `Failed to restore: ${err.message}` });
    }
  },

  // ── resetData ────────────────────────────────────────────────────────────────
  resetData: async () => {
    if (!isSupabaseConfigured || !supabase) {
      set({ error: 'Supabase not configured — cannot reset data.' });
      return;
    }

    set({ loading: true, error: null });

    try {
      // Wipe cloud data
      await supabase.from('habit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('habits').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Push starter habits
      for (const h of STARTER_HABITS) {
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

      set({ habits: STARTER_HABITS, logs: {}, loading: false });
    } catch (err: any) {
      console.error('[HabitFlow] resetData error:', err);
      set({ loading: false, error: `Reset failed: ${err.message}` });
    }
  },

  // ── syncLocalDataToSupabase ───────────────────────────────────────────────────
  // This is now a "re-fetch from Supabase" action since we have no local data
  syncLocalDataToSupabase: async () => {
    if (!isSupabaseConfigured || !supabase) {
      set({ error: 'Supabase is not configured. Please set environment variables.' });
      return;
    }

    set({ isSyncing: true, error: null, syncSuccessMessage: null });

    try {
      await get().initialize();
      set({ isSyncing: false, syncSuccessMessage: 'Data refreshed from Supabase successfully!' });
    } catch (err: any) {
      set({ isSyncing: false, error: `Refresh failed: ${err.message}` });
    }
  },
}));
