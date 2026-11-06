'use client';

import { useEffect, useState } from 'react';
import { userData } from '@/lib/user-data-client';

export default function useGroupNotifications(userId: number | undefined) {
  const [state, setState] = useState<{ userId: number; count: number } | null>(null);
  useEffect(() => {
    if (userId === undefined) return;
    const key = `helptask:seen-groups:${userId}`;
    const controller = new AbortController();
    let memberships: number[] = [];
    let seen = new Set<number>();
    let loading = false;
    const readSeen = () => {
      try {
        const saved: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
        if (Array.isArray(saved)) seen = new Set(saved.filter(id => Number.isSafeInteger(id) && id > 0));
      } catch { /* Keep notifications usable when browser storage is unavailable. */ }
    };
    const publish = () => setState({ userId, count: memberships.filter(id => !seen.has(id)).length });
    const persist = () => {
      try { localStorage.setItem(key, JSON.stringify([...seen])); } catch { /* Session state still works. */ }
    };
    readSeen();
    const load = async () => {
      if (loading || document.visibilityState === 'hidden') return;
      loading = true;
      try {
        const result = await userData<{ groupIds: number[] }>('resource=group-memberships', { method: 'GET', signal: controller.signal });
        if (controller.signal.aborted) return;
        memberships = result.groupIds;
        // A later re-addition should notify again after a removal is observed.
        seen = new Set([...seen].filter(id => memberships.includes(id)));
        persist(); publish();
      } catch { /* Retry on the next poll without clearing the last count. */ }
      finally { loading = false; }
    };
    const markSeen = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: number; groupIds: number[] }>).detail;
      if (detail?.userId !== userId) return;
      detail.groupIds.forEach(id => seen.add(id));
      persist(); publish();
    };
    const syncStorage = (event: StorageEvent) => { if (event.key === key || event.key === null) { readSeen(); publish(); } };
    void load();
    const timer = window.setInterval(load, 5000);
    window.addEventListener('focus', load);
    document.addEventListener('visibilitychange', load);
    window.addEventListener('helptask:groups-viewed', markSeen);
    window.addEventListener('storage', syncStorage);
    return () => {
      controller.abort(); clearInterval(timer);
      window.removeEventListener('focus', load);
      document.removeEventListener('visibilitychange', load);
      window.removeEventListener('helptask:groups-viewed', markSeen);
      window.removeEventListener('storage', syncStorage);
    };
  }, [userId]);
  return state?.userId === userId ? state?.count ?? 0 : 0;
}
