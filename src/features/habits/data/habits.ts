export const periods = ['Morning', 'Afternoon', 'Evening'] as const;
export const habitIcons = ['water', 'read', 'exercise', 'grow', 'rest'] as const;
export type HabitPeriod = typeof periods[number];
export type HabitIcon = typeof habitIcons[number];
export interface Habit { id: string; name: string; period: HabitPeriod; icon: HabitIcon; createdOn: string; completedDates: string[]; }
export const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
export function weekDays(date: Date): Date[] {
  const first = addDays(date, -((date.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => addDays(first, index));
}
export function currentStreak(habit: Habit, today: Date): number {
  const completed = new Set(habit.completedDates.filter(day => day >= habit.createdOn && day <= dateKey(today)));
  let date = completed.has(dateKey(today)) ? today : addDays(today, -1), count = 0;
  while (completed.has(dateKey(date))) { count++; date = addDays(date, -1); }
  return count;
}
export interface StreakRange { start: string; end: string; length: number; }
export function streakSummary(habit: Habit, today: Date) {
  const completed = [...new Set(habit.completedDates)].filter(day => day >= habit.createdOn && day <= dateKey(today)).sort();
  const ranges: StreakRange[] = [];
  for (const day of completed) {
    const previous = ranges[ranges.length - 1];
    const [year, month, date] = (previous?.end ?? day).split('-').map(Number);
    if (previous && dateKey(addDays(new Date(year, month - 1, date, 12), 1)) === day) {
      previous.end = day;
      previous.length++;
    } else ranges.push({ start: day, end: day, length: 1 });
  }
  return { current: currentStreak(habit, today), longest: Math.max(0, ...ranges.map(range => range.length)), completed, ranges };
}
export function readHabits(raw: string | null): Habit[] {
  const parsed: unknown = JSON.parse(raw ?? '[]');
  if (!Array.isArray(parsed)) throw new Error('Invalid habits');
  const seen = new Set<string>();
  return parsed.filter((item): item is Habit => {
    if (!item || typeof item.id !== 'string' || seen.has(item.id) || typeof item.name !== 'string' || !item.name.trim() ||
      !periods.includes(item.period) || !habitIcons.includes(item.icon) || typeof item.createdOn !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(item.createdOn) || !Array.isArray(item.completedDates) ||
      !item.completedDates.every((day: unknown) => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day))) return false;
    seen.add(item.id); return true;
  });
}
