'use client';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faMessage, faPlus } from '@fortawesome/free-solid-svg-icons';
import type { ChatFriend, Friendship } from '@/features/chat/data/chat.types';
import { friendName } from '@/features/chat/data/chat.types';
import { acceptFriend } from '@/features/chat/data/chat.repository';

interface Props {
  relations: Friendship[];
  selectedId?: number;
  onSelect: (friend: ChatFriend) => void;
  onAdd: () => void;
  loading: boolean;
  error: string;
  onRefresh: () => Promise<void>;
  userId: number;
}
export default function FriendsComponent({ relations, selectedId, onSelect, onAdd, loading, error, onRefresh, userId }: Props) {
  const [search, setSearch] = useState('');
  const [accepting, setAccepting] = useState<number | null>(null);
  const [requestError, setRequestError] = useState('');
  const accepted = relations.filter(row => row.accepted);
  const pending = relations.filter(row => !row.accepted);
  const visible = accepted.filter(({ friend }) => `${friendName(friend)} ${friend.Username}`.toLowerCase().includes(search.trim().toLowerCase()));
  const accept = async (id: number) => {
    if (accepting !== null) return;
    setAccepting(id); setRequestError('');
    try { await acceptFriend(userId, id); await onRefresh(); }
    catch { setRequestError('Could not accept request. Please try again.'); }
    finally { setAccepting(null); }
  };
  return <aside className="flex h-full min-h-0 w-full flex-col border-r-2 border-blue-200 bg-white text-blue-900 md:w-72 md:shrink-0">
    <header className="border-b border-blue-200 bg-blue-300 p-4">
      <div className="flex items-center justify-between"><div><h1 className="text-lg font-bold">Friends</h1><p className="text-xs text-blue-800">{accepted.length} friends</p></div>
        <button type="button" aria-label="Find friends" onClick={onAdd} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/70 hover:bg-white"><FontAwesomeIcon icon={faPlus} /></button></div>
      <label className="mt-4 flex items-center rounded-lg border border-blue-200 bg-white px-3 py-2">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="text-blue-400" /><input aria-label="Search friends" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search friends..." className="min-w-0 w-full bg-transparent pl-2 text-sm outline-none" />
      </label>
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      {loading && <p role="status" className="p-3 text-sm text-blue-500">Loading friends...</p>}
      {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}<button type="button" onClick={() => void onRefresh()} className="mt-2 block font-semibold underline">Try again</button></div>}
      {!loading && !error && visible.length === 0 && <p className="p-3 text-sm text-blue-500">{search ? 'No matching friends.' : 'No friends yet. Find someone to connect with.'}</p>}
      <ul className="space-y-1">{visible.map(({ friend }) => <li key={friend.id}><button type="button" onClick={() => onSelect(friend)} aria-pressed={selectedId === friend.id}
        className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${selectedId === friend.id ? 'bg-blue-200' : 'hover:bg-blue-50'}`}>
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold">{friendName(friend).slice(0, 1).toUpperCase()}</span>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{friendName(friend)}</span><span className="block truncate text-xs text-blue-500">@{friend.Username}</span></span>
        <FontAwesomeIcon icon={faMessage} className="text-blue-400" />
      </button></li>)}</ul>
      {pending.length > 0 && <section className="mt-5 border-t border-blue-100 pt-4"><h2 className="mb-2 px-2 text-xs font-semibold uppercase text-blue-500">Friend requests</h2>
        {requestError && <p role="alert" className="p-2 text-xs text-red-600">{requestError}</p>}
        {pending.map(({ friend, incoming }) => <div key={friend.id} className="mb-2 rounded-lg bg-blue-50 p-3">
          <p className="truncate text-sm font-semibold">{friendName(friend)}</p><p className="text-xs text-blue-500">{incoming ? 'Wants to connect with you' : 'Request sent'}</p>
          {incoming && <button type="button" disabled={accepting !== null} onClick={() => void accept(friend.id)} className="mt-2 rounded-md bg-blue-300 px-3 py-1 text-xs font-semibold disabled:opacity-50">{accepting === friend.id ? 'Accepting...' : 'Accept request'}</button>}
        </div>)}
      </section>}
    </div>
    <footer className="border-t border-blue-200 bg-blue-50 p-3"><button type="button" onClick={onAdd} className="w-full rounded-lg bg-blue-300 px-4 py-3 text-sm font-semibold hover:bg-blue-400">Find new friends</button></footer>
  </aside>;
}
