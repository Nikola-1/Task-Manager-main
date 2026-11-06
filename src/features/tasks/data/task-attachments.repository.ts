import { supabase } from '@/lib/supabase/client';
import { TASK_FILE_MAX_BYTES } from '@/features/tasks/data/task-validation';

export async function saveTaskAttachment(taskId: number, userId: number, file: File) {
  if (!file.name.trim() || file.size <= 0) throw new Error('Choose a non-empty file.');
  if (file.size > TASK_FILE_MAX_BYTES) throw new Error('Attachment must be 25 MB or smaller.');
  const folder = `user-${userId}`;
  const name = `${crypto.randomUUID()}-${file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const path = `${folder}/${name}`;
  const bucket = supabase.storage.from('FileBucket');
  const { error: uploadError } = await bucket.upload(path, file);
  if (uploadError) throw new Error(`Could not upload attachment: ${uploadError.message}`);
  try {
    const { data, error } = await supabase.from('tasks')
      .update({ folder_name: folder, file_name: name }).eq('id', taskId)
      .select('id,folder_name,file_name').single();
    if (error || !data) throw new Error(error?.message ?? 'Task was not updated.');
    return { folder_name: data.folder_name as string, file_name: data.file_name as string };
  } catch (cause) {
    // Remove only the new upload; preserve the previous attachment on failure.
    try {
      const { error } = await bucket.remove([path]);
      if (error) console.error('Could not remove unused attachment:', error.message);
    } catch { console.error('Could not remove unused attachment.'); }
    throw new Error(`Could not save attachment: ${cause instanceof Error ? cause.message : 'Please try again.'}`);
  }
}
