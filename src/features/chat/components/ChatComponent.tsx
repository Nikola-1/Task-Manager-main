'use client';
import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import type { ChatFriend, ChatMessage } from '@/features/chat/data/chat.types';
import { friendName } from '@/features/chat/data/chat.types';

interface Props { userId: number; friend: ChatFriend; onBack: () => void; }
function Conversation({ userId, friend, onBack }: Props) {
  const storageKey = `help-task:chat:${userId}:${friend.id}`;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const nearBottom = useRef(true);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
      if (!Array.isArray(stored)) throw new Error('Invalid history');
      setMessages(stored.filter((message): message is ChatMessage =>
        message && typeof message.id === 'string' && typeof message.content === 'string' &&
        message.senderId === userId && typeof message.createdAt === 'string' && !Number.isNaN(Date.parse(message.createdAt))));
    } catch { setError('Saved conversation could not be loaded.'); }
    setReady(true);
  }, [storageKey, userId]);
  useEffect(() => {
    if (nearBottom.current && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [messages]);
  useEffect(() => {
    if (input.current) {
      input.current.style.height = 'auto';
      input.current.style.height = `${Math.min(input.current.scrollHeight, 120)}px`;
    }
  }, [draft]);
  const send = () => {
    const content = draft.trim();
    if (!content || !ready) return;
    const next = [...messages, { id: crypto.randomUUID(), senderId: userId, content, createdAt: new Date().toISOString() }];
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      nearBottom.current = true; setMessages(next); setDraft(''); setError(''); input.current?.focus();
    } catch { setError('Could not save this message on your device. Your draft is preserved.'); }
  };
  return <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-white text-blue-900">
    <header className="flex shrink-0 items-center gap-3 border-b border-blue-200 bg-blue-300 px-4 py-3">
      <button type="button" aria-label="Back to friends" onClick={onBack} className="rounded-lg p-2 hover:bg-blue-200 md:hidden"><FontAwesomeIcon icon={faArrowLeft} /></button>
      <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/70 font-bold">{friendName(friend).slice(0, 1).toUpperCase()}</span>
      <div className="min-w-0"><h2 className="truncate font-bold">{friendName(friend)}</h2><p className="truncate text-xs text-blue-800">@{friend.Username}</p></div>
    </header>
    <p className="shrink-0 border-b border-blue-100 bg-blue-50 px-4 py-2 text-xs text-blue-700">Local chat preview: messages are saved on this device and are not delivered to your friend.</p>
    <div ref={scroll} onScroll={event => { const node = event.currentTarget; nearBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80; }}
      className="min-h-0 flex-1 overflow-y-auto bg-blue-50/40 p-4">
      {!ready ? <p role="status" className="text-center text-sm text-blue-500">Loading conversation...</p> : messages.length === 0 ?
        <div className="flex h-full items-center justify-center text-center text-sm text-blue-500">Start a conversation preview with {friendName(friend)}.</div> :
        <ol aria-label="Conversation" className="mx-auto flex max-w-3xl flex-col gap-3">{messages.map((message, index) => {
          const date = new Date(message.createdAt);
          const previous = index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null;
          return <li key={message.id}>
            {previous !== date.toDateString() && <p className="mb-4 mt-2 text-center text-xs text-blue-500">{date.toLocaleDateString('sr-RS')}</p>}
            <div className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-br-md bg-blue-300 px-4 py-3 shadow-sm sm:max-w-[75%]">
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
              <time dateTime={message.createdAt} className="mt-1 block text-right text-[10px] text-blue-800">{date.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}</time>
            </div></div>
          </li>;
        })}</ol>}
    </div>
    <footer className="shrink-0 border-t border-blue-200 bg-white p-3">
      {error && <p role="alert" className="mb-2 text-sm text-red-600">{error}</p>}
      <form onSubmit={event => { event.preventDefault(); send(); }} className="flex items-end gap-2">
        <textarea ref={input} aria-label="Message" value={draft} onChange={event => setDraft(event.target.value)} rows={1} disabled={!ready}
          onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }}
          placeholder="Write a message..." className="min-h-11 min-w-0 max-h-[120px] flex-1 resize-none rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        <button type="submit" aria-label="Save message locally" disabled={!ready || !draft.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-300 hover:bg-blue-400 disabled:opacity-40"><FontAwesomeIcon icon={faPaperPlane} /></button>
      </form><p className="mt-2 text-[11px] text-blue-500">Enter to save locally. Shift + Enter for a new line.</p>
    </footer>
  </section>;
}

export default function ChatComponent({ userId, friend, onBack }: Partial<Props>) {
  if (!friend || userId === undefined) return <section className="flex h-full min-w-0 flex-1 items-center justify-center bg-blue-50/50 p-6 text-center text-sm text-blue-500">Choose a friend to open a conversation.</section>;
  return <Conversation key={`${userId}-${friend.id}`} userId={userId} friend={friend} onBack={onBack ?? (() => {})} />;
}
