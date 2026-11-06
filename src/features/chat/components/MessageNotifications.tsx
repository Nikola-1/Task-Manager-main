'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { userData } from '@/lib/user-data-client';

interface Notification { id: string; senderId: number; senderName: string; content: string; }
interface NotificationPage { cursor: string; messages: Notification[]; }

export default function MessageNotifications({ userId }: { userId: number }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let cursor: string | undefined;
    let loading = false;
    const load = async () => {
      if (loading || document.visibilityState === 'hidden') return;
      loading = true;
      try {
        const page = await userData<NotificationPage>(`resource=message-notifications${cursor ? `&after=${encodeURIComponent(cursor)}` : ''}`, { method: 'GET', signal: controller.signal });
        if (controller.signal.aborted) return;
        cursor = page.cursor;
        if (page.messages.length) {
          setNotifications(previous => [...previous, ...page.messages].slice(-3));
          for (const message of page.messages) {
            const timer = setTimeout(() => {
              setNotifications(previous => previous.filter(item => item.id !== message.id));
              timers.delete(timer);
            }, 8000);
            timers.add(timer);
          }
        }
      } catch { /* Retry without advancing the cursor when the connection fails. */ }
      finally { loading = false; }
    };
    void load();
    const interval = window.setInterval(load, 3000);
    window.addEventListener('focus', load);
    document.addEventListener('visibilitychange', load);
    return () => {
      controller.abort(); clearInterval(interval); timers.forEach(clearTimeout);
      window.removeEventListener('focus', load); document.removeEventListener('visibilitychange', load);
    };
  }, [userId]);
  return <aside aria-label="New messages" aria-live="polite" aria-relevant="additions" className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 pb-[env(safe-area-inset-bottom)]">
    {notifications.map(message => <div key={message.id} className="inbox-surface pointer-events-auto flex items-start gap-2 rounded-xl border border-blue-200 bg-white p-4 text-blue-900 shadow-xl">
      <Link href={`/pages/Chat?friendId=${message.senderId}`} onClick={() => setNotifications(previous => previous.filter(item => item.id !== message.id))} className="min-w-0 flex-1 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500">
        <span className="block text-xs text-blue-500">New message</span>
        <span className="mt-1 block truncate text-sm font-semibold">{message.senderName}</span>
        <span className="mt-1 line-clamp-2 break-words text-sm">{message.content}</span>
      </Link>
      <button type="button" aria-label="Dismiss notification" onClick={() => setNotifications(previous => previous.filter(item => item.id !== message.id))} className="flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-blue-100">×</button>
    </div>)}
  </aside>;
}
