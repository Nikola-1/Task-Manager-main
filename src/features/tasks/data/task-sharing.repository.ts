import { supabase } from '@/lib/supabase/client';

export interface TaskRecipient { id: number; name: string; assigned: boolean }

async function sharingContext(taskId: number, groupId: number, senderId: number) {
  const [task, members, assignments] = await Promise.all([
    supabase.from('tasks').select('id,user_id,Group_id,Deleted').eq('id', taskId).single(),
    supabase.from('Users_Groups').select('id_user,Users(id,Username,Name,Surname)').eq('id_group', groupId),
    supabase.from('Users_Tasks').select('User_id').eq('Task_id', taskId),
  ]);
  for (const result of [task, members, assignments]) if (result.error) throw new Error(result.error.message);
  const rows = (members.data ?? []) as unknown as { id_user: number; Users: { id: number; Username: string | null; Name: string | null; Surname: string | null } | null }[];
  const assigned = new Set((assignments.data ?? []).map(row => row.User_id));
  if (!task.data || task.data.Group_id !== groupId || task.data.Deleted || !rows.some(row => row.id_user === senderId)) {
    throw new Error('You can only send active tasks within your group.');
  }
  if (task.data.user_id !== senderId && !assigned.has(senderId)) throw new Error('This task is not assigned to you.');
  return { rows, assigned, ownerId: task.data.user_id };
}

export async function getTaskRecipients(taskId: number, groupId: number, senderId: number): Promise<TaskRecipient[]> {
  const { rows, assigned, ownerId } = await sharingContext(taskId, groupId, senderId);
  return [...new Map(rows.flatMap(row => row.Users && row.id_user !== senderId ? [[row.id_user, {
    id: row.id_user,
    name: row.Users.Username?.trim() || [row.Users.Name, row.Users.Surname].filter(Boolean).join(' ') || `Member ${row.id_user}`,
    assigned: assigned.has(row.id_user) || ownerId === row.id_user,
  }] as const] : [])).values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function sendTaskToMember(taskId: number, groupId: number, senderId: number, recipientId: number) {
  // Recheck current membership and assignment before writing, including after the dialog was opened.
  const { rows, assigned, ownerId } = await sharingContext(taskId, groupId, senderId);
  if (recipientId === senderId || !rows.some(row => row.id_user === recipientId)) throw new Error('Choose another member of this group.');
  if (assigned.has(recipientId) || ownerId === recipientId) return false;
  const { error } = await supabase.from('Users_Tasks').insert({ User_id: recipientId, Task_id: taskId });
  if (error) throw new Error(error.message);
  return true;
}
