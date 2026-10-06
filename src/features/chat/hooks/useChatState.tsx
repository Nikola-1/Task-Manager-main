'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { getFriends } from '@/features/chat/data/chat.repository';
import type { ChatFriend, Friendship } from '@/features/chat/data/chat.types';
import { supabase } from '@/lib/supabase/client';

export default function useChatState() {
  const { user, authLoading } = useAuth();
  const userId = user?.id;
  const [isActive, setIsActive] = useState(false);
  const [relations, setRelations] = useState<Friendship[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<ChatFriend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const request = useRef(0);
  const invalidate = useCallback(() => { request.current++; }, []);
  const refreshFriends = useCallback(async () => {
    const current = ++request.current;
    if (!userId) { setRelations([]); setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const data = await getFriends({ id: userId });
      if (current !== request.current) return;
      setRelations(data);
      setSelectedFriend(selected => selected && data.some(row => row.accepted && row.friend.id === selected.id) ? selected : null);
    } catch {
      if (current === request.current) setError('Could not load friends. Check your connection and try again.');
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [userId]);
  useEffect(() => {
    setSelectedFriend(null);
    setRelations([]);
    setIsActive(false);
    void refreshFriends();
    if (!user?.id) return;
    const channel = supabase.channel(`friends-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Friends', filter: `id_user=eq.${user.id}` }, () => void refreshFriends())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Friends', filter: `id_friend=eq.${user.id}` }, () => void refreshFriends())
      .subscribe();
    return () => { invalidate(); void supabase.removeChannel(channel); };
  }, [refreshFriends, user?.id, invalidate]);
  return { user, authLoading, relations, selectedFriend, setSelectedFriend, loading, error, refreshFriends,
    friendsModalProps: { isActive, setIsActive, relations, onUpdate: refreshFriends } };
}
