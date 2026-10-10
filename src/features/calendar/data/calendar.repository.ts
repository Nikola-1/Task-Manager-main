import { supabase } from '@/lib/supabase/client';
import type { CalendarTask, CalendarTag } from './calendar';
interface TaskRow {
  id: number;
  name: string | null;
  date: string | null;
  Completed: boolean | null;
  tags_tasks: { Tags: CalendarTag | null }[] | null;
  category: { name: string | null; Stickers: { sticker_path: string | null } | null } | null;
}
// Explicit foreign keys match the live database and disambiguate embedded relations.
const fields = 'id,name,date,Completed,tags_tasks(Tags!tags_tasks_id_tag_fkey(id,name,color)),category:Categories!tasks_category_id_fkey(name,Stickers!Categories_sticker_id_fkey(sticker_path))';

export async function getCalendarTasks(userId: number, groupId: number | null, from: string, to: string): Promise<CalendarTask[]> {
  let owned = supabase.from('tasks').select(fields).eq('user_id', userId)
    .not('Deleted', 'is', true).gte('date', from).lte('date', to);
  let assigned = supabase.from('Users_Tasks').select(`tasks!Users_Tasks_Task_id_fkey!inner(${fields})`)
    .eq('User_id', userId).not('tasks.Deleted', 'is', true).gte('tasks.date', from).lte('tasks.date', to);
  owned = groupId === null ? owned.is('Group_id', null) : owned.eq('Group_id', groupId);
  assigned = groupId === null ? assigned.is('tasks.Group_id', null) : assigned.eq('tasks.Group_id', groupId);
  const [ownedResult, assignedResult] = await Promise.all([owned.order('id'), assigned.order('Task_id')]);
  if (ownedResult.error) throw new Error(ownedResult.error.message);
  if (assignedResult.error) throw new Error(assignedResult.error.message);
  const ownRows = (ownedResult.data ?? []) as unknown as TaskRow[];
  const assignedRows = (assignedResult.data ?? []) as unknown as { tasks: TaskRow | null }[];
  const unique = new Map<number, TaskRow>();
  for (const task of [...ownRows, ...assignedRows.flatMap(row => row.tasks ? [row.tasks] : [])]) {
    if (task.date) unique.set(task.id, task);
  }
  return [...unique.values()].sort((a, b) => a.date!.localeCompare(b.date!) || a.id - b.id).map(task => ({
    id: task.id,
    name: task.name?.trim() || 'Untitled task',
    date: task.date!,
    Completed: task.Completed === true,
    tags: [...new Map((task.tags_tasks ?? []).flatMap(row => row.Tags ? [[row.Tags.id, { ...row.Tags, name: row.Tags.name?.trim() || 'Tag' }] as const] : [])).values()].sort((a, b) => a.id - b.id),
    category: task.category ? { name: task.category.name ?? 'Category', stickerPath: task.category.Stickers?.sticker_path ?? null } : null,
  }));
}
