import { supabase } from '@/lib/supabase/client';

export interface TaskDateRange { from: string; to: string }

export function validateTaskDateRange(range: TaskDateRange): string | null {
  const validDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if (!validDate(range.from) || !validDate(range.to)) return 'Choose a valid start and end date.';
  if (range.from > range.to) return 'End date must be on or after start date.';
  return null;
}

export async function getTasksInDateRange(range: TaskDateRange, userId: number, groupId: number | null) {
  const error = validateTaskDateRange(range);
  if (error) throw new Error(error);
  let query = supabase.from('Users_Tasks')
    .select('tasks!inner(*,tags_tasks(*,Tags(*)),category:Categories!tasks_category_id_fkey(name,Stickers!Categories_sticker_id_fkey(sticker_path)))')
    .eq('User_id', userId)
    .eq('tasks.Deleted', false)
    .gte('tasks.date', range.from)
    .lte('tasks.date', range.to);
  query = groupId === null ? query.is('tasks.Group_id', null) : query.eq('tasks.Group_id', groupId);
  return await query.order('Task_id', { ascending: true });
}
