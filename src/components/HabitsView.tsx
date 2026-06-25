import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Trash,
  Edit,
  Archive,
  RotateCcw,
  Sparkles,
  Info,
  X,
  Check,
  AlertTriangle
} from 'lucide-react';
import { Habit, HabitCategory } from '../types';
import LucideIcon from './LucideIcon';

interface HabitsViewProps {
  habits: Habit[];
  onCreateHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  onEditHabit: (id: string, updated: Omit<Habit, 'id' | 'createdAt'>) => void;
  onDeleteHabit: (id: string) => void;
  onArchiveHabit: (id: string) => void;
  onRestoreHabit: (id: string) => void;
}

const CATEGORIES: HabitCategory[] = [
  'Health',
  'Fitness',
  'Coding',
  'Learning',
  'Reading',
  'Meditation',
  'Work',
  'Finance',
  'Custom',
];

const CURATED_ICONS = [
  'Dumbbell',
  'BookOpen',
  'Code2',
  'Droplet',
  'Sparkles',
  'Brain',
  'Flame',
  'Zap',
  'Calendar',
  'Compass',
  'Activity',
  'Award',
  'TrendingUp',
];

const CURATED_COLORS = [
  { hex: '#6366F1', name: 'Indigo' },
  { hex: '#10B981', name: 'Emerald' },
  { hex: '#F59E0B', name: 'Amber' },
  { hex: '#EC4899', name: 'Pink' },
  { hex: '#8B5CF6', name: 'Violet' },
  { hex: '#0EA5E9', name: 'Sky' },
  { hex: '#EF4444', name: 'Red' },
  { hex: '#F97316', name: 'Orange' },
  { hex: '#64748B', name: 'Slate' }
];

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  onCreateHabit,
  onEditHabit,
  onDeleteHabit,
  onArchiveHabit,
  onRestoreHabit,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('Health');
  const [icon, setIcon] = useState('Dumbbell');
  const [color, setColor] = useState('#6366F1');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [goal, setGoal] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Tab State: active vs archived
  const [habitsTab, setHabitsTab] = useState<'active' | 'archived'>('active');

  // Confirmation trigger states
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const activeHabits = habits.filter((h) => !h.archived);
  const archivedHabits = habits.filter((h) => h.archived);

  // Opens modal for creating a new habit
  const handleOpenCreateModal = () => {
    setEditingHabitId(null);
    setName('');
    setDescription('');
    setCategory('Health');
    setIcon('Dumbbell');
    setColor('#6366F1');
    setFrequency('daily');
    setGoal(1);
    setIsModalOpen(true);
  };

  // Opens modal on editing habit
  const handleOpenEditModal = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setName(habit.name);
    setDescription(habit.description);
    setCategory(habit.category);
    setIcon(habit.icon);
    setColor(habit.color);
    setFrequency(habit.frequency);
    setGoal(habit.goal);
    setStartDate(habit.startDate);
    setIsModalOpen(true);
  };

  // Submit Modal Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const habitData = {
      name,
      description,
      category,
      icon,
      color,
      frequency,
      goal,
      startDate,
      archived: false,
    };

    if (editingHabitId) {
      onEditHabit(editingHabitId, habitData);
    } else {
      onCreateHabit(habitData);
    }
    setIsModalOpen(false);
  };

  const currentList = habitsTab === 'active' ? activeHabits : archivedHabits;

  return (
    <div className="space-y-6" id="habits_manager_view">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            Habit Configurator
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build, edit, archive and customize your daily productivity routines.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer"
          id="btn_add_habit"
        >
          <Plus className="w-5 h-5" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Habits Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setHabitsTab('active')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer relative ${
            habitsTab === 'active'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Active Routines
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xxs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-500">
            {activeHabits.length}
          </span>
        </button>
        <button
          onClick={() => setHabitsTab('archived')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer relative ${
            habitsTab === 'archived'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Archived Archives
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xxs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-500">
            {archivedHabits.length}
          </span>
        </button>
      </div>

      {/* Habit Lists */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" id="habits_cards_grid">
        {currentList.length === 0 ? (
          <div className="col-span-full py-16 text-center space-y-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl" id="empty_habits_indicator">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Info className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">
                {habitsTab === 'active' ? 'No active habits found' : 'No archived habits'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                {habitsTab === 'active'
                  ? 'Let’s construct your custom routine. Tap the "+ New Habit" button above to register an interactive habit.'
                  : 'You have not archived any habits yet! Archived habits keep your tracking statistics without clogging today’s checklist.'}
              </p>
            </div>
            {habitsTab === 'active' && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
              >
                + Register First Habit
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {currentList.map((habit) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                key={habit.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between group hover:border-slate-300 dark:hover:border-slate-700/80 hover:shadow-xs transition-all duration-300"
              >
                {/* Decorative Accent Strip */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: habit.color }}
                />

                <div className="space-y-4 shadow-xxs">
                  {/* Category and Quick Actions */}
                  <div className="flex justify-between items-center">
                    <span
                      className="text-xxs font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider"
                      style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                    >
                      {habit.category}
                    </span>

                    {/* Action buttons hover display list */}
                    <div className="flex items-center gap-1.5">
                      {habit.archived ? (
                        <button
                          onClick={() => onRestoreHabit(habit.id)}
                          className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
                          title="Restore Habit to active track"
                        >
                          <RotateCcw size={14} />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(habit)}
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
                            title="Edit Habit details"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => onArchiveHabit(habit.id)}
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-amber-600 dark:hover:text-amber-400 transition-all cursor-pointer"
                            title="Archive Habit"
                          >
                            <Archive size={14} />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => setConfirmDeleteId(habit.id)}
                        className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer"
                        title="Delete Habit"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Icon and Title Block */}
                  <div className="flex gap-3.5 items-start">
                    <div
                      className="p-3 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: habit.color }}
                    >
                      <LucideIcon name={habit.icon} size={22} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-slate-50 text-base md:text-lg tracking-tight">
                        {habit.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {habit.description || "No description provided."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Meta details footer */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xxs font-semibold text-slate-500">
                  <span>Frequency: <span className="text-slate-850 dark:text-slate-300 font-bold capitalize">{habit.frequency}</span></span>
                  <span>Goal: <span className="text-slate-850 dark:text-slate-300 font-bold">{habit.goal}x standard</span></span>
                  <span>Created: <span className="text-slate-850 dark:text-slate-300">{habit.startDate}</span></span>
                </div>

                {/* Inline Confirmation Overlap Dialog for Delete */}
                <AnimatePresence>
                  {confirmDeleteId === habit.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-slate-950/90 flex flex-col justify-center items-center p-4 text-center z-10"
                    >
                      <AlertTriangle className="w-8 h-8 text-rose-500 animate-bounce mb-2" />
                      <h4 className="text-white text-sm font-bold">Delete "{habit.name}"?</h4>
                      <p className="text-slate-400 text-xxs max-w-[200px] mt-1">
                        Are you sure? This action is permanent and deletes all completion logs!
                      </p>
                      <div className="flex gap-2.5 mt-4">
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xxs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            onDeleteHabit(habit.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xxs font-bold"
                          id={`btn_confirm_delete_${habit.id}`}
                        >
                          Confirm Delete
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Habit Create / Edit Modal Wizard Backdrop */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="habit_form_modal">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Banner Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <Sparkles size={18} />
                  </div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white tracking-tight">
                    {editingHabitId ? 'Revise Routine Details' : 'Design New Habit Routine'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Entry */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Routine Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Meditate regularly, High-intensity gym, Read books..."
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-400 transition outline-none"
                    id="habit_input_name"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Description / Motivation
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Keep it descriptive! E.g. morning checklist, hydrated skin, lower heartbeat..."
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-400 transition outline-none resize-none"
                  />
                </div>

                {/* Category Chip List */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Routine Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                          category === cat
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection Palette */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Custom Color Accent
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {CURATED_COLORS.map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setColor(col.hex)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white border-2 hover:scale-105 transition active:scale-95 cursor-pointer ${
                          color === col.hex ? 'border-indigo-600 dark:border-white ring-2 ring-indigo-505/25' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.name}
                      >
                        {color === col.hex && <Check size={14} className="stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icon selection GRID */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Visual Icon ID
                  </label>
                  <div className="grid grid-cols-6 sm:grid-cols-7 gap-2 max-h-24 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
                    {CURATED_ICONS.map((icName) => (
                      <button
                        key={icName}
                        type="button"
                        onClick={() => setIcon(icName)}
                        className={`p-2.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          icon === icName
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950'
                        }`}
                      >
                        <LucideIcon name={icName} size={16} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frequency & Start Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Track Interval
                    </label>
                    <div className="grid grid-cols-2 bg-slate-50 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setFrequency('daily')}
                        className={`py-1 text-center font-bold text-xs rounded-lg transition-all cursor-pointer ${
                          frequency === 'daily'
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xxs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        Daily
                      </button>
                      <button
                        type="button"
                        onClick={() => setFrequency('weekly')}
                        className={`py-1 text-center font-bold text-xs rounded-lg transition-all cursor-pointer ${
                          frequency === 'weekly'
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xxs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        Weekly
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Start Tracking
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Goal slider input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <span>Performance Target completions</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{goal} {frequency === 'daily' ? 'time(s) daily' : 'time(s) weekly'}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={frequency === 'daily' ? '3' : '7'}
                    value={goal}
                    onChange={(e) => setGoal(parseInt(e.target.value))}
                    className="w-full text-indigo-600 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-lg appearance-none outline-none accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Modal Footer Controls */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3.5 bg-slate-50/20 dark:bg-slate-900/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/10 cursor-pointer"
                    id="btn_save_habit"
                  >
                    {editingHabitId ? 'Save Changes' : 'Launch Routine'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
