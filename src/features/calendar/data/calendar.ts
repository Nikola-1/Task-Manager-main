export interface CalendarTag { id: number; name: string; color: string | null; }
export interface CalendarTask { id: number; name: string; date: string; Completed: boolean; tags: CalendarTag[]; category: { name: string; stickerPath: string | null } | null; }
export const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export function monthDays(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const offset = (first.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Array.from({ length: Math.ceil((count + offset) / 7) * 7 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), 1 - offset + index, 12));
}
export function tagColor(value: string | null | undefined): string {
  if (/^#[0-9a-f]{6}$/i.test(value ?? '')) return value!;
  if (/^#[0-9a-f]{3}$/i.test(value ?? '')) return '#' + value!.slice(1).split('').map(char => char + char).join('');
  return '#60a5fa';
}
export function tasksByDate(tasks: CalendarTask[]): Map<string, CalendarTask[]> {
  const result = new Map<string, CalendarTask[]>();
  for (const task of tasks) {
    const rows = result.get(task.date) ?? [];
    rows.push(task); result.set(task.date, rows);
  }
  return result;
}
