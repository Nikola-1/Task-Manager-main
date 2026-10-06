'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { requestFriend, searchUsers } from '@/features/chat/data/chat.repository';
import { friendName } from '@/features/chat/data/chat.types';
import type { ChatFriend, Friendship } from '@/features/chat/data/chat.types';

interface Props {
  isActive: boolean;
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>;
  relations: Friendship[];
  onUpdate: () => Promise<void>;
}
function FindFriends({ setIsActive, relations, onUpdate }: Omit<Props, 'isActive'>) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<ChatFriend[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<number | null>(null);
  const [requested, setRequested] = useState<number[]>([]);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  const titleId = useId();
  useEffect(() => {
    const focus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; input.current?.focus();
    return () => { document.body.style.overflow = overflow; focus?.focus(); };
  }, []);
  useEffect(() => {
    let cancelled = false;
    setUsers([]); setError('');
    if (query.trim().length < 2 || !user?.id) { setLoading(false); return; }
    setLoading(true);
    const timer = setTimeout(() => {
      searchUsers(query, user.id).then(data => { if (!cancelled) setUsers(data); })
        .catch(() => { if (!cancelled) setError('Could not search users. Please try again.'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, user?.id]);
  const close = () => { if (!pending.current) setIsActive(false); };
  const invite = async (id: number) => {
    if (!user?.id || pending.current) return;
    pending.current = true; setSending(id); setError('');
    try { await requestFriend(user.id, id); setRequested(current => [...current, id]); await onUpdate(); }
    catch { setError('Could not send the friend request. Please try again.'); }
    finally { pending.current = false; setSending(null); }
  };
  return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/40 p-4 backdrop-blur-sm" onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-2xl"
      onKeyDown={event => {
        if (event.key === 'Escape') { event.stopPropagation(); close(); }
        if (event.key === 'Tab') {
          const controls = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input');
          if (!controls?.length) return;
          const first = controls[0], last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }}>
      <header className="flex items-center justify-between border-b border-blue-200 bg-blue-300 px-5 py-4"><div><h2 id={titleId} className="font-bold text-blue-900">Find friends</h2><p className="mt-1 text-xs text-blue-800">Search by name or username.</p></div>
        <button type="button" aria-label="Close find friends" disabled={sending !== null} onClick={close} className="rounded-lg px-3 py-1 text-xl text-blue-900 hover:bg-blue-200 disabled:opacity-40">×</button></header>
      <div className="p-4"><input ref={input} aria-label="Search users" value={query} onChange={event => setQuery(event.target.value)} placeholder="Type at least 2 characters..." className="w-full rounded-lg border border-blue-200 px-3 py-2.5 text-sm text-blue-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></div>
      <div className="min-h-40 overflow-y-auto px-4 pb-4">
        {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        {loading ? <p role="status" className="p-3 text-sm text-blue-500">Searching...</p> : query.trim().length < 2 ? <p className="p-3 text-sm text-blue-500">Find people you want to chat with.</p> : !users.length && !error ? <p className="p-3 text-sm text-blue-500">No matching users.</p> : null}
        <ul className="space-y-2">{users.map(profile => {
          const relation = relations.find(row => row.friend.id === profile.id);
          const connected = Boolean(relation) || requested.includes(profile.id);
          return <li key={profile.id} className="flex items-center justify-between gap-2 rounded-xl bg-blue-50 p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-blue-900">{friendName(profile)}</p><p className="truncate text-xs text-blue-500">@{profile.Username}</p></div>
            <button type="button" disabled={connected || sending !== null} onClick={() => void invite(profile.id)} className="shrink-0 rounded-lg bg-blue-300 px-3 py-2 text-xs font-semibold text-blue-900 disabled:opacity-50">{relation?.accepted ? 'Friends' : connected ? 'Pending' : sending === profile.id ? 'Sending...' : 'Add friend'}</button>
          </li>;
        })}</ul>
      </div>
      <footer className="border-t border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">Your friend must accept the request before appearing in your chats.</footer>
    </div>
  </div>, document.body);
}
export default function FriendsModal({ isActive, ...props }: Props) { return isActive ? <FindFriends {...props} /> : null; }
