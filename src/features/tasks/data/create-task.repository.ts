import { supabase } from '@/lib/supabase/client';
import { validateTaskDraft } from '@/features/tasks/data/task-validation';

export interface TaskChoice { id: number; name: string }

export async function getTaskCreationChoices(userId: number, groupId: number | null) {
  let categories = supabase.from('Categories').select('id,name').order('id');
  let tags = supabase.from('Tags').select('id,name').order('id');
  if (groupId !== null) {
    categories = categories.eq('group_id', groupId);
    tags = tags.eq('group_id', groupId);
  } else {
    categories = categories.eq('user_id', userId).is('group_id', null);
    tags = tags.eq('User_id', userId).is('group_id', null);
  }
  const [categoryResult, tagResult] = await Promise.all([categories, tags]);
  if (categoryResult.error || tagResult.error) throw new Error('Could not load categories and tags.');
  return { categories: (categoryResult.data ?? []) as TaskChoice[], tags: (tagResult.data ?? []) as TaskChoice[] };
}

interface CreateTaskOptions {
  name: string; date: Date; userId: number; groupId: number | null;
  categoryId: number | null; tagIds: number[]; file: File | null;
  priority?: string;
}

export async function createTaskWithOptions(options: CreateTaskOptions): Promise<number> {
  const { date, userId, groupId, categoryId, file } = options;
  const name = options.name.trim();
  const errors = validateTaskDraft(options);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  const tagIds = [...new Set(options.tagIds)];
  const folder = `user-${userId}`;
  const fileName = file ? `${crypto.randomUUID()}-${file.name.replace(/[/\\]/g, '_')}` : null;
  const path = fileName ? `${folder}/${fileName}` : null;
  let uploaded = false;
  let taskId: number | null = null;
  try {
    if (file && path) {
      const { error } = await supabase.storage.from('FileBucket').upload(path, file);
      if (error) throw error;
      uploaded = true;
    }
    const { data, error } = await supabase.from('tasks').insert({
      name,
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      user_id: userId, Group_id: groupId, category_id: categoryId,
      ...(fileName ? { file_name: fileName, folder_name: folder } : {}),
    }).select('id').single();
    if (error || !data) throw new Error(error?.message ?? 'Could not create task.');
    taskId = data.id;
    const { error: assignmentError } = await supabase.from('Users_Tasks').insert({ User_id: userId, Task_id: taskId });
    if (assignmentError) throw assignmentError;
    if (tagIds.length) {
      const { error: tagError } = await supabase.from('tags_tasks').insert(tagIds.map(id => ({ id_tag: id, id_task: taskId, user_id: userId })));
      if (tagError) throw tagError;
    }
    return data.id;
  } catch (cause) {
    // Undo only this attempt so retrying does not create a duplicate task or attachment.
    const cleanupErrors: unknown[] = [];
    if (taskId !== null) {
      for (const [table, column] of [['tags_tasks', 'id_task'], ['Users_Tasks', 'Task_id'], ['tasks', 'id']]) {
        try {
          const { error } = await supabase.from(table).delete().eq(column, taskId);
          if (error) cleanupErrors.push(error);
        } catch (error) { cleanupErrors.push(error); }
      }
    }
    if (uploaded && path) {
      try {
        const { error } = await supabase.storage.from('FileBucket').remove([path]);
        if (error) cleanupErrors.push(error);
      } catch (error) { cleanupErrors.push(error); }
    }
    if (cleanupErrors.length) throw new Error('Task setup failed. Some data may have been saved; refresh the list before retrying.');
    throw new Error(cause instanceof Error ? cause.message : 'Could not create task. Please try again.');
  }
}
