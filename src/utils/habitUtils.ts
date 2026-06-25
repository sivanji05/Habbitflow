import { Habit, HabitLogs } from '../types';
import { STARTER_HABITS } from '../data/defaultData';

// Helper to format Date as YYYY-MM-DD
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Generate array of YYYY-MM-DD strings for the last N days
export function getLastNDays(n: number, endDate: Date = new Date()): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(endDate.getTime());
    d.setDate(endDate.getDate() - i);
    dates.push(formatDate(d));
  }
  return dates;
}

// Calculate Current Streak and Longest Streak for a specific habit
export function calculateStreak(habitId: string, logs: HabitLogs, todayStr: string = '2026-06-11'): { currentStreak: number; longestStreak: number } {
  const dates = Object.keys(logs).sort();
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Calculate overall completed dates for this habit
  const completedSet = new Set<string>();
  dates.forEach((date) => {
    if (logs[date]?.[habitId]) {
      completedSet.add(date);
    }
  });

  // Longest streak calculation
  let longest = 0;
  let running = 0;

  // Declare effectiveToday at function scope so it's available for current streak below
  const effectiveToday = todayStr || formatDate(new Date());
  
  // Sort all dates chronologically
  const sortedDates = Array.from(completedSet).sort();
  
  if (sortedDates.length > 0) {
    let prevDate: Date | null = null;
    let localStreak = 0;

    // We can also just count days sequentially
    const firstDate = new Date(sortedDates[0]);
    const lastDate = new Date(effectiveToday);
    
    let tempStreak = 0;
    const ptrDate = new Date(firstDate);
    
    while (ptrDate <= lastDate) {
      const dStr = formatDate(ptrDate);
      if (completedSet.has(dStr)) {
        tempStreak++;
        if (tempStreak > longest) {
          longest = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
      ptrDate.setDate(ptrDate.getDate() + 1);
    }
  }

  // Current streak (counting backwards from today)
  let current = 0;
  const backDate = new Date(effectiveToday);

  // If today is completed, start streak from today. 
  // If today is NOT completed, check if yesterday was completed. 
  // If yesterday was completed, start streak from yesterday (since today is still in progress).
  // If yesterday was also missed, streak is 0.
  const todayCompleted = completedSet.has(todayStr);
  
  const yesterday = new Date(backDate.getTime());
  yesterday.setDate(backDate.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);
  const yesterdayCompleted = completedSet.has(yesterdayStr);

  if (todayCompleted) {
    current = 1;
    backDate.setDate(backDate.getDate() - 1);
    while (true) {
      const dStr = formatDate(backDate);
      if (completedSet.has(dStr)) {
        current++;
        backDate.setDate(backDate.getDate() - 1);
      } else {
        break;
      }
    }
  } else if (yesterdayCompleted) {
    current = 1;
    yesterday.setDate(yesterday.getDate() - 1);
    while (true) {
      const dStr = formatDate(yesterday);
      if (completedSet.has(dStr)) {
        current++;
        yesterday.setDate(yesterday.getDate() - 1);
      } else {
        break;
      }
    }
  } else {
    current = 0;
  }

  // Double check longest is at least current
  if (current > longest) {
    longest = current;
  }

  return { currentStreak: current, longestStreak: longest };
}

// Calculate total completions across all habits and logs
export function getTotalCompletions(logs: HabitLogs): number {
  let count = 0;
  Object.values(logs).forEach((dayLogs) => {
    Object.values(dayLogs).forEach((completed) => {
      if (completed) count++;
    });
  });
  return count;
}

// Achievements/Xp-related helpers removed

// Calculate consistency percentage over last N days (default 30)
export function getOverallConsistencyScore(habits: Habit[], logs: HabitLogs, daysCount: number = 30, todayStr: string = '2026-06-11'): number {
  const activeHabits = habits.filter(h => !h.archived);
  if (activeHabits.length === 0) return 0;

  const dates = getLastNDays(daysCount, new Date(todayStr));
  let totalLogsExpected = activeHabits.length * dates.length;
  let totalLogsCompleted = 0;

  dates.forEach((date) => {
    const dayLogs = logs[date] || {};
    activeHabits.forEach((habit) => {
      if (dayLogs[habit.id]) {
        totalLogsCompleted++;
      }
    });
  });

  return totalLogsExpected > 0 ? Math.round((totalLogsCompleted / totalLogsExpected) * 100) : 0;
}

// Get completion distribution for Recharts Pie Chart (Completed, Missed, Partial)
// Let's analyze the past 30 days
export function getCompletionDistribution(habits: Habit[], logs: HabitLogs, daysCount: number = 30, todayStr: string = '2026-06-11') {
  const activeHabits = habits.filter(h => !h.archived);
  if (activeHabits.length === 0) {
    return [
      { name: 'Completed', value: 0, color: '#10B981' },
      { name: 'Missed', value: 30, color: '#EF4444' },
      { name: 'Partial', value: 0, color: '#F59E0B' },
    ];
  }

  const dates = getLastNDays(daysCount, new Date(todayStr));
  let completed = 0;
  let missed = 0;
  let partial = 0;

  dates.forEach((date) => {
    const dayLogs = logs[date] || {};
    let dailyCompletions = 0;
    
    activeHabits.forEach((habit) => {
      if (dayLogs[habit.id]) {
        dailyCompletions++;
      }
    });

    if (dailyCompletions === activeHabits.length) {
      completed++; // Done all habits
    } else if (dailyCompletions === 0) {
      missed++; // Done nothing
    } else {
      partial++; // Done some
    }
  });

  return [
    { name: 'Fully Completed Days', value: completed, color: '#10B981' },
    { name: 'Partially Completed Days', value: partial, color: '#F59E0B' },
    { name: 'Fully Missed Days', value: missed, color: '#EF4444' },
  ];
}

// Generate weak vs strong habit summaries
export function getHabitEfficiencyList(habits: Habit[], logs: HabitLogs, daysCount: number = 30, todayStr: string = '2026-06-11') {
  const dates = getLastNDays(daysCount, new Date(todayStr));
  
  return habits.map((habit) => {
    let completedCount = 0;
    dates.forEach((date) => {
      if (logs[date]?.[habit.id]) {
        completedCount++;
      }
    });
    const rate = dates.length > 0 ? Math.round((completedCount / dates.length) * 100) : 0;
    return {
      habit,
      rate,
      completedCount,
    };
  }).sort((a, b) => b.rate - a.rate);
}

// Weekday stats for bar charts (Mon - Sun completions count over the past N weeks)
export function getWeekdayCompletions(habits: Habit[], logs: HabitLogs, weeksCount: number = 4, todayStr: string = '2026-06-11'): { name: string; count: number }[] {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const completionsPerDay: { [key: string]: number } = {
    'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0, 'Friday': 0, 'Saturday': 0, 'Sunday': 0
  };

  const totalPastDays = weeksCount * 7;
  const dates = getLastNDays(totalPastDays, new Date(todayStr));

  dates.forEach((dateStr) => {
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const weekdayName = weekdays[d.getDay()];
    
    const dayLogs = logs[dateStr] || {};
    habits.forEach((habit) => {
      if (dayLogs[habit.id] && !habit.archived) {
        completionsPerDay[weekdayName] = (completionsPerDay[weekdayName] || 0) + 1;
      }
    });
  });

  // Return formatted array ordered Mon-Sun
  const orderList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return orderList.map((day) => ({
    name: day.substring(0, 3), // e.g. "Mon"
    count: completionsPerDay[day] || 0,
  }));
}

// Monthly consistency trends for Line Chart
// Renders Daily Completion percentage for the last 30 days
export function getMonthlyConsistencyTrends(habits: Habit[], logs: HabitLogs, todayStr: string = '2026-06-11'): { date: string; displayDate: string; rate: number }[] {
  const dates = getLastNDays(30, new Date(todayStr));
  const activeHabits = habits.filter(h => !h.archived);

  return dates.map((dateStr) => {
    const dayLogs = logs[dateStr] || {};
    let completionsCount = 0;
    activeHabits.forEach((habit) => {
      if (dayLogs[habit.id]) completionsCount++;
    });

    const rate = activeHabits.length > 0 ? Math.round((completionsCount / activeHabits.length) * 100) : 0;
    const dateObj = new Date(dateStr);
    const displayDate = `${dateObj.toLocaleString('default', { month: 'short' })} ${dateObj.getDate()}`; // e.g. "Jun 5"

    return {
      date: dateStr,
      displayDate,
      rate,
    };
  });
}
