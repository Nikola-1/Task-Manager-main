import { supabase } from '@/lib/supabase/client';
import type { UserType } from '@/types/UserType';
import type { ChatFriend, Friendship } from './chat.types';

const profileFields = 'id, Name, Surname, Username';
interface Relation { id_user: number; id_friend: number; accepted_at: string | null; }

export async function getFriends(user: Pick<UserType, 'id'>): Promise<Friendship[]> {
  const { data, error } = await supabase.from('Friends').select('id_user, id_friend, accepted_at')
    .or(`id_user.eq.${user.id},id_friend.eq.${user.id}`);
  if (error) throw new Error(error.message);
  const relations = (data ?? []) as Relation[];
  const ids = [...new Set(relations.map(row => row.id_user === user.id ? row.id_friend : row.id_user))].filter(id => id !== user.id);
  if (!ids.length) return [];
  const profiles = await supabase.from('Users').select(profileFields).in('id', ids);
  if (profiles.error) throw new Error(profiles.error.message);
  return (profiles.data as ChatFriend[] ?? []).map(friend => {
    const matches = relations.filter(row => row.id_user === friend.id || row.id_friend === friend.id);
    return { friend, accepted: matches.some(row => row.accepted_at !== null), incoming: matches.some(row => row.id_friend === user.id) };
  });
}

export async function searchUsers(query: string, userId: number): Promise<ChatFriend[]> {
  const safeQuery = query.trim().replace(/[%_,().\\]/g, '');
  if (safeQuery.length < 2) return [];
  const { data, error } = await supabase.from('Users').select(profileFields).neq('id', userId)
    .or(`Username.ilike.%${safeQuery}%,Name.ilike.%${safeQuery}%,Surname.ilike.%${safeQuery}%`).limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []) as ChatFriend[];
}

export async function requestFriend(userId: number, friendId: number): Promise<void> {
  if (userId === friendId) throw new Error('Choose another user.');
  const existing = await supabase.from('Friends').select('id_user')
    .or(`and(id_user.eq.${userId},id_friend.eq.${friendId}),and(id_user.eq.${friendId},id_friend.eq.${userId})`).limit(1);
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data?.length) return;
  const { error } = await supabase.from('Friends').insert({ id_user: userId, id_friend: friendId });
  if (error) throw new Error(error.message);
}

export async function acceptFriend(userId: number, friendId: number): Promise<void> {
  const { data, error } = await supabase.from('Friends').update({ accepted_at: new Date().toISOString() })
    .eq('id_user', friendId).eq('id_friend', userId).is('accepted_at', null).select('id_user');
  if (error || !data?.length) throw new Error(error?.message ?? 'Request is no longer available.');
}
