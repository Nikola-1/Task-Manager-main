'use client';
import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import type { ChatFriend, ChatMessage } from '@/features/chat/data/chat.types';
import { friendName } from '@/features/chat/data/chat.types';
import { useTheme } from '@/features/account/context/ThemeContext';
import { userData } from '@/lib/user-data-client';

interface MessagePage { messages: ChatMessage[]; hasMore: boolean; }
function mergeMessages(previous: ChatMessage[], incoming: ChatMessage[]) {
  return [...new Map([...previous, ...incoming].map(message => [message.id, message])).values()]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

interface Props { userId: number; friend: ChatFriend; onBack: () => void; }
function Conversation({ userId, friend, onBack }: Props) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const sendBusy = useRef(false);
  const olderBusy = useRef(false);
  const olderLoaded = useRef(false);
  const retryMessage = useRef<{ id: string; content: string } | null>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const nearBottom = useRef(true);
  const audio = useRef<AudioContext | null>(null);
  useEffect(() => () => {
    if (audio.current) void audio.current.close().catch(() => {});
    audio.current = null;
  }, [theme]);
  const playSendPop = async () => {
    if (theme !== 'mario') return;
    try {
      const context = audio.current ?? (audio.current = new AudioContext());
      if (context.state === 'suspended') await context.resume();
      if (context.state !== 'running') return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(650, now);
      oscillator.frequency.exponentialRampToValueAtTime(220, now + 0.09);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(now);
      oscillator.stop(now + 0.12);
    } catch { /* Audio availability must not interrupt sending. */ }
  };
  useEffect(() => {
    const controller = new AbortController();
    let fetching = false;
    const load = async () => {
      if (fetching || document.visibilityState === 'hidden') return;
      fetching = true;
      try {
        const page = await userData<MessagePage>(`resource=messages&friendId=${friend.id}`, { method: 'GET', signal: controller.signal });
        if (controller.signal.aborted) return;
        setMessages(previous => mergeMessages(previous, page.messages));
        if (!olderLoaded.current) setHasMore(page.hasMore);
        setReady(true); setError('');
        const latestIncoming = [...page.messages].reverse().find(message => message.senderId === friend.id);
        if (latestIncoming && document.visibilityState === 'visible') {
          await userData('resource=read-messages', { method: 'POST', signal: controller.signal,
            body: { friendId: friend.id, through: latestIncoming.createdAt } });
        }
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not load conversation.');
      } finally { fetching = false; }
    };
    void load();
    const timer = window.setInterval(load, 5000);
    window.addEventListener('focus', load);
    document.addEventListener('visibilitychange', load);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener('focus', load); document.removeEventListener('visibilitychange', load); };
  }, [friend.id, userId]);
  useEffect(() => {
    if (nearBottom.current && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [messages]);
  useEffect(() => {
    if (input.current) {
      input.current.style.height = 'auto';
      input.current.style.height = `${Math.min(input.current.scrollHeight, 120)}px`;
    }
  }, [draft]);
  const loadOlder = async () => {
    if (!messages.length || olderBusy.current) return;
    olderBusy.current = true; setLoadingOlder(true);
    const first = messages[0];
    const node = scroll.current;
    const previousHeight = node?.scrollHeight ?? 0;
    const previousTop = node?.scrollTop ?? 0;
    nearBottom.current = false;
    try {
      const page = await userData<MessagePage>(`resource=messages&friendId=${friend.id}&before=${encodeURIComponent(`${first.createdAt}|${first.id}`)}`);
      olderLoaded.current = true;
      setMessages(previous => mergeMessages(previous, page.messages)); setHasMore(page.hasMore); setError('');
      requestAnimationFrame(() => { if (node) node.scrollTop = previousTop + node.scrollHeight - previousHeight; });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load older messages.'); }
    finally { olderBusy.current = false; setLoadingOlder(false); }
  };
  const send = async () => {
    const content = draft.trim();
    if (!content || !ready || sendBusy.current) return;
    if (retryMessage.current?.content !== content) retryMessage.current = { id: crypto.randomUUID(), content };
    sendBusy.current = true; setSending(true); setError('');
    try {
      const message = await userData<ChatMessage>('resource=messages', { method: 'POST', body: { ...retryMessage.current, friendId: friend.id } });
      nearBottom.current = true; setMessages(previous => mergeMessages(previous, [message])); setDraft(''); setError('');
      retryMessage.current = null;
      void playSendPop();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not send message. Your draft is preserved.'); }
    finally { sendBusy.current = false; setSending(false); requestAnimationFrame(() => input.current?.focus()); }
  };
  return <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-white text-blue-900">
    <header className="flex shrink-0 items-center gap-3 border-b border-blue-200 bg-blue-300 px-4 py-3">
      <button type="button" aria-label="Back to friends" onClick={onBack} className="rounded-lg p-2 hover:bg-blue-200 md:hidden"><FontAwesomeIcon icon={faArrowLeft} /></button>
      <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/70 font-bold">{friendName(friend).slice(0, 1).toUpperCase()}</span>
      <div className="min-w-0"><h2 className="truncate font-bold text-[rgb(64,83,127)]">{friendName(friend)}</h2><p className="truncate text-xs text-blue-800">@{friend.Username}</p></div>
    </header>
    <div ref={scroll} onScroll={event => { const node = event.currentTarget; nearBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80; }}
      className="min-h-0 flex-1 overflow-y-auto bg-blue-50/40 p-4">
      {hasMore && <button type="button" disabled={loadingOlder} onClick={() => void loadOlder()} className="mx-auto mb-4 block text-xs text-blue-700 underline">{loadingOlder ? 'Loading...' : 'Load older messages'}</button>}
      {!ready ? <p role="status" className="text-center text-sm text-blue-500">{error ? 'Conversation could not be loaded.' : 'Loading conversation...'}</p> : messages.length === 0 ?
        <div className="flex h-full items-center justify-center text-center text-sm text-blue-500">Start a conversation with {friendName(friend)}.</div> :
        <ol aria-label="Conversation" className="mx-auto flex max-w-3xl flex-col gap-3">{messages.map((message, index) => {
          const date = new Date(message.createdAt);
          const previous = index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null;
          return <li key={message.id}>
            {previous !== date.toDateString() && <p className="mb-4 mt-2 text-center text-xs text-blue-500">{date.toLocaleDateString('sr-RS')}</p>}
            <div className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[75%] ${message.senderId === userId ? 'rounded-br-md bg-blue-300' : 'rounded-bl-md bg-white'}`}>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
              <time dateTime={message.createdAt} className="mt-1 block text-right text-[10px] text-blue-800">{date.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}</time>
            </div></div>
          </li>;
        })}</ol>}
    </div>
    <footer className="shrink-0 border-t border-blue-200 bg-white p-3">
      {error && <p role="alert" className="mb-2 text-sm text-red-600">{error}</p>}
      <form onSubmit={event => { event.preventDefault(); void send(); }} className="flex items-end gap-2">
        <textarea ref={input} aria-label="Message" maxLength={10000} value={draft} onChange={event => setDraft(event.target.value)} rows={1} disabled={!ready || sending}
          onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }}
          placeholder="Write a message..." className="min-h-11 min-w-0 max-h-[120px] flex-1 resize-none rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        <button type="submit" aria-label="Send message" disabled={!ready || sending || !draft.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-300 hover:bg-blue-400 disabled:opacity-40"><FontAwesomeIcon icon={faPaperPlane} /></button>
      </form><p className="mt-2 text-[11px] text-blue-500">{sending ? 'Sending...' : 'Enter to send. Shift + Enter for a new line.'}</p>
    </footer>
  </section>;
}

export default function ChatComponent({ userId, friend, onBack }: Partial<Props>) {
  if (!friend || userId === undefined) return <section className="flex h-full min-w-0 flex-1 items-center justify-center bg-blue-50/50 p-6 text-center text-sm text-blue-500">Choose a friend to open a conversation.</section>;
  return <Conversation key={`${userId}-${friend.id}`} userId={userId} friend={friend} onBack={onBack ?? (() => {})} />;
}
