import { ApiError, apiError, checkDatabase, checkOrigin, database, positiveId, readBody, sessionUserId, uuid } from '@/lib/server/user-data';
import { habitIcons, periods } from '@/features/habits/data/habits';

export const runtime = 'nodejs';

function validDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ApiError('Invalid date.');
  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new ApiError('Invalid date.');
  return value;
}
async function ownedHabit(db: ReturnType<typeof database>, userId: number, id: string) {
  const result = await db.from('habits').select('id,created_on').eq('id', id).eq('user_id', userId).maybeSingle();
  checkDatabase(result.error);
  if (!result.data) throw new ApiError('Habit not found.', 404);
  return result.data;
}

export async function GET(request: Request) {
  try {
    const userId = await sessionUserId();
    const db = database();
    const params = new URL(request.url).searchParams;
    const resource = params.get('resource');
    if (resource === 'group-memberships') {
      const { data, error } = await db.from('Users_Groups').select('id_group,Groups!inner(Admin)')
        .eq('id_user', userId).neq('Groups.Admin', userId);
      checkDatabase(error);
      return Response.json({ groupIds: [...new Set((data ?? []).map(row => row.id_group))] }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (resource === 'message-notifications') {
      const startedAt = new Date().toISOString();
      const after = params.get('after');
      let query = db.from('chat_messages')
        .select('id,sender_id,content,created_at,sender:Users!chat_messages_sender_id_fkey(Name,Surname,Username)')
        .eq('recipient_id', userId);
      if (after) {
        const [timestamp, id] = after.split('|');
        uuid(id);
        if (!timestamp || !/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/.test(timestamp) || Number.isNaN(Date.parse(timestamp))) throw new ApiError('Invalid notification cursor.');
        query = query.or(`created_at.gt.${timestamp},and(created_at.eq.${timestamp},id.gt.${id})`);
      }
      const { data, error } = await query.order('created_at', { ascending: !!after }).order('id', { ascending: !!after }).limit(after ? 50 : 1);
      checkDatabase(error);
      const rows = data ?? [];
      const last = rows.at(-1);
      const cursor = last ? `${last.created_at}|${last.id}` : after ?? `${startedAt}|00000000-0000-0000-0000-000000000000`;
      return Response.json({ cursor, messages: after ? rows.map(row => {
        const sender = Array.isArray(row.sender) ? row.sender[0] : row.sender;
        const senderName = `${sender?.Name ?? ''} ${sender?.Surname ?? ''}`.trim() || sender?.Username || 'New message';
        return { id: row.id, senderId: row.sender_id, senderName, content: row.content.slice(0, 160) };
      }) : [] }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (resource === 'unread-messages') {
      const { count, error } = await db.from('chat_messages').select('id', { count: 'exact', head: true })
        .eq('recipient_id', userId).is('read_at', null);
      checkDatabase(error);
      return Response.json({ count: count ?? 0 }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (resource === 'priorities') {
      const { data, error } = await db.from('task_priorities').select('task_id,priority').eq('user_id', userId);
      checkDatabase(error);
      return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (resource === 'habits') {
      const { data, error } = await db.from('habits').select('id,name,period,icon,created_on,habit_completions(completed_on)')
        .eq('user_id', userId).order('created_on').order('id');
      checkDatabase(error);
      return Response.json((data ?? []).map(habit => ({
        id: habit.id, name: habit.name, period: habit.period, icon: habit.icon, createdOn: habit.created_on,
        completedDates: habit.habit_completions.map((day: { completed_on: string }) => day.completed_on),
      })), { headers: { 'Cache-Control': 'no-store' } });
    }
    if (resource === 'messages') {
      const friendId = positiveId(params.get('friendId'));
      let query = db.from('chat_messages').select('id,sender_id,content,created_at')
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${userId})`);
      const before = params.get('before');
      if (before) {
        const [timestamp, id] = before.split('|');
        uuid(id);
        if (!timestamp || !/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/.test(timestamp) || Number.isNaN(Date.parse(timestamp))) throw new ApiError('Invalid page cursor.');
        query = query.or(`created_at.lt.${timestamp},and(created_at.eq.${timestamp},id.lt.${id})`);
      }
      const { data, error } = await query.order('created_at', { ascending: false }).order('id', { ascending: false }).limit(101);
      checkDatabase(error);
      const rows = (data ?? []).slice(0, 100).reverse();
      return Response.json({ messages: rows.map(row => ({ id: row.id, senderId: row.sender_id, content: row.content, createdAt: row.created_at })), hasMore: (data?.length ?? 0) > 100 }, { headers: { 'Cache-Control': 'no-store' } });
    }
    throw new ApiError('Unknown resource.', 404);
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const userId = await sessionUserId();
    const db = database();
    const resource = new URL(request.url).searchParams.get('resource');
    const body = await readBody(request);
    if (resource === 'read-messages') {
      const friendId = positiveId(body.friendId);
      const through = body.through;
      if (typeof through !== 'string' || !/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/.test(through) || Number.isNaN(Date.parse(through)) || Date.parse(through) > Date.now()) throw new ApiError('Invalid read timestamp.');
      const { error } = await db.from('chat_messages').update({ read_at: new Date().toISOString() })
        .eq('recipient_id', userId).eq('sender_id', friendId).is('read_at', null).lte('created_at', through);
      checkDatabase(error);
      return Response.json({ success: true });
    }
    if (resource === 'priorities') {
      const taskId = positiveId(body.taskId);
      if (typeof body.priority !== 'string' || !['none', 'low', 'medium', 'high'].includes(body.priority)) throw new ApiError('Invalid priority.');
      const task = await db.from('tasks').select('id,user_id,Deleted').eq('id', taskId).maybeSingle();
      checkDatabase(task.error);
      if (!task.data) throw new ApiError('Task not found.', 404);
      if (task.data.user_id !== userId) {
        const assignment = await db.from('Users_Tasks').select('Task_id').eq('Task_id', taskId).eq('User_id', userId).limit(1);
        checkDatabase(assignment.error);
        if (!assignment.data?.length) throw new ApiError('You cannot edit this task.', 403);
      }
      const { error } = await db.from('task_priorities').upsert({ user_id: userId, task_id: taskId, priority: body.priority }, { onConflict: 'user_id,task_id' });
      checkDatabase(error);
      return Response.json({ success: true });
    }
    if (resource === 'messages') {
      const friendId = positiveId(body.friendId);
      const id = uuid(body.id);
      if (friendId === userId || typeof body.content !== 'string' || !body.content.trim() || body.content.length > 10000) throw new ApiError('Enter a message up to 10,000 characters.');
      const friends = await db.from('Friends').select('id_user').not('accepted_at', 'is', null)
        .or(`and(id_user.eq.${userId},id_friend.eq.${friendId}),and(id_user.eq.${friendId},id_friend.eq.${userId})`).limit(1);
      checkDatabase(friends.error);
      if (!friends.data?.length) throw new ApiError('You can send messages to accepted friends only.', 403);
      const { data, error } = await db.from('chat_messages').insert({ id, sender_id: userId, recipient_id: friendId, content: body.content.trim() })
        .select('id,sender_id,recipient_id,content,created_at').single();
      if (error?.code === '23505') {
        // Retrying after a lost response must not send the same message twice.
        const existing = await db.from('chat_messages').select('id,sender_id,recipient_id,content,created_at').eq('id', id).eq('sender_id', userId).eq('recipient_id', friendId).maybeSingle();
        checkDatabase(existing.error);
        if (!existing.data || existing.data.content !== body.content.trim()) throw new ApiError('Message ID conflict.', 409);
        return Response.json({ id: existing.data.id, senderId: existing.data.sender_id, content: existing.data.content, createdAt: existing.data.created_at });
      }
      checkDatabase(error);
      return Response.json({ id: data!.id, senderId: data!.sender_id, content: data!.content, createdAt: data!.created_at });
    }
    if (resource === 'habits') {
      const id = uuid(body.id);
      if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 100 || !periods.some(period => period === body.period) || !habitIcons.some(icon => icon === body.icon)) throw new ApiError('Invalid habit.');
      const fields = { name: body.name.trim(), period: body.period, icon: body.icon };
      if (body.create === true) {
        const { error } = await db.from('habits').insert({ id, user_id: userId, ...fields, created_on: validDate(body.createdOn) });
        checkDatabase(error);
      } else {
        await ownedHabit(db, userId, id);
        const { error } = await db.from('habits').update(fields).eq('id', id).eq('user_id', userId);
        checkDatabase(error);
      }
      return Response.json({ success: true });
    }
    if (resource === 'completions') {
      const id = uuid(body.habitId);
      const habit = await ownedHabit(db, userId, id);
      const day = validDate(body.day);
      // Use the current Budapest date rather than the server's UTC date.
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      if (day < habit.created_on || day > today || typeof body.completed !== 'boolean') throw new ApiError('Invalid completion date.');
      const result = body.completed
        ? await db.from('habit_completions').upsert({ habit_id: id, completed_on: day }, { onConflict: 'habit_id,completed_on' })
        : await db.from('habit_completions').delete().eq('habit_id', id).eq('completed_on', day);
      checkDatabase(result.error);
      return Response.json({ success: true });
    }
    throw new ApiError('Unknown resource.', 404);
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    const userId = await sessionUserId();
    const db = database();
    const params = new URL(request.url).searchParams;
    if (params.get('resource') !== 'habits') throw new ApiError('Unknown resource.', 404);
    const id = uuid(params.get('id'));
    await ownedHabit(db, userId, id);
    const { error } = await db.from('habits').delete().eq('id', id).eq('user_id', userId);
    checkDatabase(error);
    return Response.json({ success: true });
  } catch (error) { return apiError(error); }
}
