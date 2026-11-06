'use client';

import { useEffect, useState } from 'react';
import { userData } from '@/lib/user-data-client';

export default function useUnreadMessages(userId: number | undefined) {
  const [unread, setUnread] = useState<{ userId: number; count: number } | null>(null);
  useEffect(() => {
    if (userId === undefined) return;
    const controller = new AbortController();
    let loading = false;
    const load = async () => {
      if (loading || document.visibilityState === 'hidden') return;
      loading = true;
      try {
        const { count } = await userData<{ count: number }>('resource=unread-messages', { method: 'GET', signal: controller.signal });
        if (!controller.signal.aborted) setUnread({ userId, count });
      } catch { /* Preserve the last count when the connection is interrupted. */ }
      finally { loading = false; }
    };
    void load();
    const timer = window.setInterval(load, 5000);
    window.addEventListener('focus', load);
    document.addEventListener('visibilitychange', load);
    return () => {
      controller.abort(); window.clearInterval(timer);
      window.removeEventListener('focus', load);
      document.removeEventListener('visibilitychange', load);
    };
  }, [userId]);
  return unread?.userId === userId ? unread?.count ?? 0 : 0;
}
