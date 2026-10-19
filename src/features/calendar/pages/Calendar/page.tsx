'use client';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faChevronLeft, faChevronRight, faCheck, faNoteSticky, faXmark, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useScope } from '@/features/groups/context/ScopeContext';
import { supabase } from '@/lib/supabase/client';
import { getCalendarTasks, setCalendarTaskCompleted } from '@/features/calendar/data/calendar.repository';
import { localDateKey, monthDays, tagColor, tasksByDate } from '@/features/calendar/data/calendar';
import type { CalendarTask } from '@/features/calendar/data/calendar';

function TaskIcon({ task }: { task: CalendarTask }) {
  return task.category?.stickerPath ? <Image src={`/img/${task.category.stickerPath}.png`} alt={task.category.name} width={18} height={18} className="shrink-0 object-contain" /> : <FontAwesomeIcon icon={faNoteSticky} className="shrink-0 text-blue-400" />;
}
function DayDialog({ date, tasks, close, setCompleted }: { date: Date; tasks: CalendarTask[]; close: () => void; setCompleted: (id: number, completed: boolean) => Promise<void> }) {
  const [pending, setPending] = useState<Set<number>>(new Set());
  const pendingRef = useRef(new Set<number>());
  const [saveError, setSaveError] = useState('');
  const toggleCompleted = async (task: CalendarTask, completed: boolean) => {
    if (pendingRef.current.has(task.id)) return;
    pendingRef.current.add(task.id);
    setPending(new Set(pendingRef.current));
    setSaveError('');
    try {
      await setCompleted(task.id, completed);
    } catch {
      setSaveError('Could not update this task. Please try again.');
    } finally {
      pendingRef.current.delete(task.id);
      setPending(new Set(pendingRef.current));
    }
  };
  const dialog = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const focus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => { document.body.style.overflow = overflow; focus?.focus(); };
  }, []);
  return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/40 p-4 backdrop-blur-sm" onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} className="calendar-day-dialog flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-2xl" onKeyDown={event => {
      if (event.key === 'Escape') { event.stopPropagation(); close(); }
      if (event.key === 'Tab') {
        const buttons = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)');
        if (!buttons?.length) return;
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }}>
      <header className="flex items-center justify-between gap-3 border-b border-blue-200 bg-blue-300 px-5 py-4"><div><h2 id={titleId} className="font-semibold text-blue-900">{date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2><p className="mt-1 text-xs text-blue-800">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</p></div><button type="button" aria-label="Close day overview" onClick={close} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-blue-900 hover:bg-blue-200"><FontAwesomeIcon icon={faXmark} /></button></header>
      <div className="min-h-0 overflow-y-auto p-4">{saveError && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{saveError}</p>}{!tasks.length ? <p className="py-8 text-center text-sm text-blue-500">No tasks for this day.</p> : <ul className="space-y-3">{tasks.map(task => <li key={task.id}>
        <button type="button" aria-pressed={task.Completed} aria-label={`Mark ${task.name} as ${task.Completed ? 'incomplete' : 'completed'}`} aria-busy={pending.has(task.id)} disabled={pending.has(task.id)} onClick={() => void toggleCompleted(task, !task.Completed)}
          className={`group flex w-full items-start gap-3 rounded-xl border border-l-4 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 ${task.Completed ? 'border-blue-200' : 'border-blue-100'}`}
          style={{ borderLeftColor: tagColor(task.tags[0]?.color), backgroundColor: `${tagColor(task.tags[0]?.color)}${task.Completed ? '20' : '12'}` }}>
          <span aria-hidden="true" className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all duration-200 ${task.Completed ? 'border-[#40537f] bg-[#40537f] text-white shadow-sm shadow-blue-200' : 'border-[#40537f] bg-white text-[#40537f] group-hover:border-[#40537f] group-hover:bg-blue-50'}`}>
            <FontAwesomeIcon icon={faCheck} className={`text-[9px] transition-all duration-200 ${task.Completed ? 'scale-100 opacity-100' : 'scale-75 opacity-0 group-hover:opacity-40'}`} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2"><TaskIcon task={task} /><span className={`min-w-0 flex-1 break-words text-sm font-semibold text-blue-900 transition-opacity ${task.Completed ? 'line-through opacity-60' : ''}`}>{task.name}</span></span>
            <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-blue-500"><span>{task.category?.name ?? 'No category'}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${task.Completed ? 'bg-blue-100 text-blue-700' : 'bg-white/80 text-blue-500'}`}>{pending.has(task.id) ? 'Saving...' : task.Completed ? 'Completed' : 'To do'}</span></span>
            {task.tags.length > 0 && <span className="mt-2 flex flex-wrap gap-2">{task.tags.map(tag => <span key={tag.id} className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-2 py-1 text-[11px] text-blue-900"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: tagColor(tag.color) }} />{tag.name}</span>)}</span>}
          </span>
        </button>
      </li>)}</ul>}</div>
    </div>
  </div>, document.body);
}
function TaskCalendar({ userId, groupId }: { userId: number; groupId: number | null }) {
  const [today, setToday] = useState(() => new Date());
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1, 12));
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tagId, setTagId] = useState('all');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const request = useRef(0);
  const days = useMemo(() => monthDays(month), [month]);
  const from = localDateKey(days[0]), to = localDateKey(days[days.length - 1]);
  const invalidate = useCallback(() => { request.current++; }, []);
  const load = useCallback(async (showLoading = true) => {
    const current = ++request.current;
    if (showLoading) setLoading(true);
    setError('');
    try {
      const data = await getCalendarTasks(userId, groupId, from, to);
      if (current === request.current) setTasks(data);
    } catch {
      if (current === request.current) setError('Could not load your tasks. Please try again.');
    } finally { if (current === request.current) setLoading(false); }
  }, [userId, groupId, from, to]);
  useEffect(() => { setTasks([]); void load(); return invalidate; }, [load, invalidate]);
  useEffect(() => {
    const channel = supabase.channel(`calendar-${userId}-${groupId ?? 'personal'}`);
    const refresh = () => void load(false);
    for (const table of ['tasks', 'Users_Tasks', 'tags_tasks', 'Tags', 'Categories', 'Stickers']) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, refresh);
    }
    channel.subscribe();
    const focus = () => { setToday(new Date()); refresh(); };
    window.addEventListener('focus', focus);
    return () => { window.removeEventListener('focus', focus); void supabase.removeChannel(channel); };
  }, [load, userId, groupId]);
  const setCompleted = async (id: number, completed: boolean) => {
    await setCalendarTaskCompleted(id, completed);
    setTasks(current => current.map(task => task.id === id ? { ...task, Completed: completed } : task));
    void load(false);
  };
  const tags = useMemo(() => [...new Map(tasks.flatMap(task => task.tags).map(tag => [tag.id, tag])).values()].sort((a, b) => a.name.localeCompare(b.name)), [tasks]);
  const activeTagId = tags.some(tag => String(tag.id) === tagId) ? tagId : 'all';
  const visible = tasks.filter(task => (!hideCompleted || !task.Completed) && (activeTagId === 'all' || task.tags.some(tag => String(tag.id) === activeTagId)));
  const byDate = tasksByDate(visible);
  const monthKey = localDateKey(month).slice(0, 7), todayKey = localDateKey(today);
  const monthTasks = tasks.filter(task => task.date.startsWith(monthKey));
  const completed = monthTasks.filter(task => task.Completed).length;
  const changeMonth = (offset: number) => { setSelectedDay(null); setTagId('all'); setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1, 12)); };
  return <main className="calendar-workspace flex h-dvh min-w-0 flex-1 flex-col overflow-hidden bg-white text-blue-900">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-blue-200 bg-blue-300 px-4 py-4 sm:px-6">
      <div><h1 className="flex items-center gap-2 text-xl font-bold"><FontAwesomeIcon icon={faCalendarDays} />Calendar</h1><p className="mt-1 text-xs text-blue-800">Your tasks, tags and categories in one view.</p></div>
      <div className="flex items-center gap-2"><button type="button" aria-label="Refresh calendar" disabled={loading} onClick={() => void load()} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/70 hover:bg-white disabled:opacity-40"><FontAwesomeIcon icon={faRotateRight} /></button><button type="button" onClick={() => { const now = new Date(); setToday(now); setSelectedDay(null); setTagId('all'); setMonth(new Date(now.getFullYear(), now.getMonth(), 1, 12)); }} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold hover:bg-blue-50">Today</button></div>
    </header>
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-blue-100 px-4 py-3 sm:px-6">
      <div className="flex items-center gap-2"><button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)} className="h-9 w-9 rounded-lg hover:bg-blue-50"><FontAwesomeIcon icon={faChevronLeft} /></button><h2 aria-live="polite" className="min-w-40 text-center text-base font-semibold sm:text-lg">{month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h2><button type="button" aria-label="Next month" onClick={() => changeMonth(1)} className="h-9 w-9 rounded-lg hover:bg-blue-50"><FontAwesomeIcon icon={faChevronRight} /></button></div>
      <div className="flex flex-wrap items-center gap-3"><select aria-label="Filter tasks by tag" value={activeTagId} onChange={event => setTagId(event.target.value)} className="max-w-44 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs outline-none focus:border-blue-400"><option value="all">All tags</option>{tags.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={hideCompleted} onChange={event => setHideCompleted(event.target.checked)} className="accent-blue-500" />Hide completed</label></div>
    </div>
    <div role="status" className="flex shrink-0 flex-wrap items-center gap-3 px-4 py-2 text-xs text-blue-500 sm:px-6">{loading ? 'Loading tasks...' : error ? 'Calendar unavailable' : `${monthTasks.length} tasks this month · ${completed} completed`}<span className="ml-auto hidden sm:block">Click a day to see its full task list.</span></div>
    {error && <div role="alert" className="mx-4 mb-3 flex items-center justify-between gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600"><span>{error}</span><button type="button" onClick={() => void load()} className="shrink-0 font-semibold underline">Try again</button></div>}
    <div className="min-h-0 flex-1 overflow-auto px-3 pb-3 sm:px-6 sm:pb-6">
      <div className="flex h-full min-w-[720px] flex-col overflow-hidden rounded-xl border border-blue-200" style={{ minHeight: days.length / 7 * 128 + 36 }} aria-label="Monthly task calendar" aria-busy={loading}>
        <div className="grid shrink-0 grid-cols-7 border-b border-blue-200 bg-blue-50">{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => <div key={day} className="px-3 py-2 text-xs font-semibold text-blue-700">{day}</div>)}</div>
        <div className="grid min-h-0 flex-1 grid-cols-7" style={{ gridTemplateRows: `repeat(${days.length / 7}, minmax(0, 1fr))` }}>{days.map((date, index) => {
          const key = localDateKey(date), dayTasks = byDate.get(key) ?? [], inMonth = date.getMonth() === month.getMonth();
          const openDay = () => setSelectedDay(date);
          return <section key={key} aria-label={date.toLocaleDateString('en-GB', { dateStyle: 'full' })} className={`flex min-h-0 min-w-0 flex-col border-blue-100 p-1.5 ${index % 7 < 6 ? 'border-r' : ''} ${index < days.length - 7 ? 'border-b' : ''} ${key === todayKey ? 'bg-blue-50' : inMonth ? 'bg-white' : 'bg-slate-50/80'}`}>
            <div className="mb-1 flex shrink-0 items-center justify-between"><button type="button" onClick={openDay} aria-label={`View tasks for ${date.toLocaleDateString('en-GB', { dateStyle: 'full' })}`} aria-current={key === todayKey ? 'date' : undefined} className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${key === todayKey ? 'bg-blue-400 text-white' : inMonth ? 'text-blue-900 hover:bg-blue-100' : 'text-slate-400 hover:bg-blue-100'}`}>{date.getDate()}</button>{dayTasks.length > 0 && <span className="pr-1 text-[10px] text-blue-400">{dayTasks.length}</span>}</div>
            <div className="min-h-0 space-y-1 overflow-hidden">{dayTasks.slice(0, 2).map(task => <button type="button" key={task.id} onClick={openDay} title={`${task.name}${task.category ? ` · ${task.category.name}` : ''}${task.tags.length ? ` · ${task.tags.map(tag => tag.name).join(', ')}` : ''}${task.Completed ? ' · Completed' : ''}`} className={`flex w-full min-w-0 items-center gap-1.5 rounded-md border-l-[3px] px-1.5 py-1.5 text-left text-[11px] transition hover:brightness-95 focus-visible:outline-blue-500 ${task.Completed ? 'opacity-60' : ''}`} style={{ borderLeftColor: tagColor(task.tags[0]?.color), backgroundColor: `${tagColor(task.tags[0]?.color)}20` }}>
              <TaskIcon task={task} /><span className={`min-w-0 flex-1 truncate ${task.Completed ? 'line-through' : ''}`}>{task.name}</span>{task.Completed && <FontAwesomeIcon icon={faCheck} className="text-[9px]" />}<span className="flex shrink-0 gap-0.5">{task.tags.slice(1, 3).map(tag => <span key={tag.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tagColor(tag.color) }} />)}</span>
            </button>)}</div>
            {dayTasks.length > 2 && <button type="button" onClick={openDay} className="mt-auto shrink-0 rounded-md px-1.5 pt-1 text-left text-[10px] font-semibold text-blue-500 hover:text-blue-900">+{dayTasks.length - 2} more</button>}
          </section>;
        })}</div>
      </div>
    </div>
    {selectedDay && <DayDialog date={selectedDay} tasks={byDate.get(localDateKey(selectedDay)) ?? []} close={() => setSelectedDay(null)} setCompleted={setCompleted} />}
  </main>;
}
export default function CalendarPage() {
  const { user, authLoading } = useAuth();
  const { groupId } = useScope();
  if (authLoading) return <p role="status" className="p-6 text-blue-900">Loading calendar...</p>;
  if (!user) return <p className="p-6 text-blue-900">Sign in to view your task calendar.</p>;
  return <TaskCalendar key={`${user.id}-${groupId}`} userId={user.id} groupId={groupId} />;
}
