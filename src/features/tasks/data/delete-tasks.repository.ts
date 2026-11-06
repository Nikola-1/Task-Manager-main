import { supabase } from '@/lib/supabase/client';

export async function permanentlyDeleteTasks(ids: number[]) {
  if (!ids.length) return;
  // Read current attachment metadata instead of trusting a stale task card.
  const { data: tasks, error: readError } = await supabase.from('tasks')
    .select('id,folder_name,file_name').in('id', [...new Set(ids)]).eq('Deleted', true);
  if (readError) throw new Error(readError.message);
  if (!tasks?.length) return;
  const deletedIds = tasks.map(task => task.id);
  const paths = new Set<string>();
  for (const task of tasks) {
    if (!task.folder_name || !task.file_name) continue;
    const path = `${task.folder_name}/${task.file_name}`;
    if (paths.has(path)) continue;
    // Older uploads could share a path across multiple tasks. Keep those files
    // until the last task referencing them is permanently deleted.
    const { count, error } = await supabase.from('tasks').select('id', { count: 'exact', head: true })
      .eq('folder_name', task.folder_name).eq('file_name', task.file_name)
      .not('id', 'in', `(${deletedIds.join(',')})`);
    if (error) throw new Error(error.message);
    if (count === 0) paths.add(path);
  }
  const files = [...paths];
  for (let start = 0; start < files.length; start += 100) {
    const { error } = await supabase.storage.from('FileBucket').remove(files.slice(start, start + 100));
    if (error) throw new Error(`Could not remove task attachments: ${error.message}`);
  }
  // Keep the task metadata available for retry if Storage rejects removal.
  const { error } = await supabase.from('tasks').delete().in('id', deletedIds).eq('Deleted', true);
  if (error) throw new Error(`Could not delete tasks: ${error.message}`);
}
