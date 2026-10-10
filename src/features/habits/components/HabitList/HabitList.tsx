'use client';
import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCheck, faChevronLeft, faChevronRight, faChevronDown, faPen, faTrash, faGlassWater, faBookOpen, faDumbbell, faSeedling, faMoon, faFire } from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/features/auth/context/AuthContext';
import { addDays, currentStreak, dateKey, habitIcons, periods, readHabits, weekDays } from '@/features/habits/data/habits';
import type { Habit, HabitIcon, HabitPeriod } from '@/features/habits/data/habits';
import '@/features/habits/components/page.css';
import HabitCalendar from '@/features/habits/components/HabitCalendar/HabitCalendar';

const icons = { water: faGlassWater, read: faBookOpen, exercise: faDumbbell, grow: faSeedling, rest: faMoon };
const iconNames = { water: 'Water', read: 'Reading', exercise: 'Exercise', grow: 'Growth', rest: 'Rest' };
function HabitForm({ habit, onSave, onCancel }: { habit: Habit | null; onSave: (name: string, period: HabitPeriod, icon: HabitIcon) => boolean; onCancel: () => void }) {
  const [name, setName] = useState(habit?.name ?? '');
  const [period, setPeriod] = useState<HabitPeriod>(habit?.period ?? 'Morning');
  const [icon, setIcon] = useState<HabitIcon>(habit?.icon ?? 'grow');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); }, []);
  return <form onSubmit={event => { event.preventDefault(); if (name.trim() && onSave(name.trim(), period, icon)) onCancel(); }} onKeyDown={event => { if (event.key === 'Escape') onCancel(); }} className="rounded-xl border border-blue-200 bg-blue-50 p-4">
    <h2 className="mb-3 font-semibold">{habit ? 'Edit habit' : 'New habit'}</h2>
    <div className="flex flex-col gap-3 sm:flex-row"><label className="flex-1 text-xs font-semibold">Habit name<input ref={input} required maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Read for 20 minutes" className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-400" /></label>
      <label className="text-xs font-semibold">Time of day<select value={period} onChange={event => setPeriod(event.target.value as HabitPeriod)} className="mt-1 block w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-normal">{periods.map(item => <option key={item}>{item}</option>)}</select></label></div>
    <fieldset className="mt-3"><legend className="mb-2 text-xs font-semibold">Icon</legend><div className="flex gap-2">{habitIcons.map(item => <button type="button" key={item} aria-label={iconNames[item]} aria-pressed={icon === item} onClick={() => setIcon(item)} className={`flex h-10 w-10 items-center justify-center rounded-lg border ${icon === item ? 'border-blue-400 bg-blue-200' : 'border-blue-100 bg-white hover:bg-blue-100'}`}><FontAwesomeIcon icon={icons[item]} /></button>)}</div></fieldset>
    <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm">Cancel</button><button type="submit" disabled={!name.trim()} className="rounded-lg bg-blue-300 px-4 py-2 text-sm font-semibold hover:bg-blue-400 disabled:opacity-40">{habit ? 'Save changes' : 'Add habit'}</button></div>
  </form>;
}
function HabitDashboard({ userId }: { userId: number }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [today, setToday] = useState(() => new Date());
  const [form, setForm] = useState<{ habit: Habit | null } | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const storageKey = `help-task:habits:${userId}`;
  useEffect(() => {
    try { setHabits(readHabits(localStorage.getItem(storageKey))); }
    catch { setError('Saved habits could not be loaded.'); }
    setReady(true);
  }, [storageKey]);
  useEffect(() => {
    const update = () => setToday(new Date());
    const timer = window.setInterval(update, 60000);
    window.addEventListener('focus', update);
    return () => { clearInterval(timer); window.removeEventListener('focus', update); };
  }, []);
  const persist = (next: Habit[]) => {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setHabits(next); setError(''); return true; }
    catch { setError('Could not save your changes on this device. Please try again.'); return false; }
  };
  const days = weekDays(selectedDate), todayKey = dateKey(today), selectedKey = dateKey(selectedDate);
  const selectedHabit = habits.find(habit => habit.id === selectedHabitId) ?? habits[0] ?? null;
  const toggle = (habit: Habit, day: Date) => {
    const key = dateKey(day);
    if (key > todayKey || key < habit.createdOn) return;
    persist(habits.map(item => item.id === habit.id ? { ...item, completedDates: item.completedDates.includes(key) ? item.completedDates.filter(value => value !== key) : [...item.completedDates, key] } : item));
  };
  const save = (name: string, period: HabitPeriod, icon: HabitIcon) => form?.habit
    ? persist(habits.map(item => item.id === form.habit?.id ? { ...item, name, period, icon } : item))
    : persist([...habits, { id: crypto.randomUUID(), name, period, icon, createdOn: todayKey, completedDates: [] }]);
  return <div className="flex min-w-0 flex-1 flex-col md:flex-row"><main className="habits-page flex h-dvh min-w-0 w-full flex-col overflow-hidden border-r border-blue-200 bg-white text-blue-900 md:w-1/2">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-blue-100 px-5 py-4"><div><h1 className="text-xl font-bold">Habits</h1><p className="mt-1 text-sm text-blue-800">Build your daily routine.</p></div><button type="button" disabled={!ready} onClick={() => setForm({ habit: null })} className="flex items-center gap-2 rounded-lg bg-blue-300 px-3 py-2 text-sm font-semibold hover:bg-blue-400 disabled:opacity-40"><FontAwesomeIcon icon={faPlus} />Add habit</button></header>
    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5"><div className="space-y-5">
      {!ready ? <p role="status" className="text-sm text-blue-500">Loading habits...</p> : <>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {form && <HabitForm key={form.habit?.id ?? 'new'} habit={form.habit} onSave={save} onCancel={() => setForm(null)} />}
        <section className="space-y-3" aria-label="Week selection"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><h2 className="text-sm font-semibold">{days[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {days[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</h2><p className="mt-1 text-xs text-blue-500">Select a day to review your habits.</p></div>
          <div className="flex shrink-0 items-center gap-1"><button type="button" aria-label="Previous week" onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="h-8 w-8 rounded-lg hover:bg-blue-50"><FontAwesomeIcon icon={faChevronLeft} /></button><button type="button" onClick={() => setSelectedDate(today)} className="rounded-lg bg-blue-50 px-2 py-1.5 text-xs font-semibold">Today</button><button type="button" aria-label="Next week" disabled={dateKey(addDays(days[0], 7)) > todayKey} onClick={() => { const next = addDays(selectedDate, 7); setSelectedDate(dateKey(next) > todayKey ? today : next); }} className="h-8 w-8 rounded-lg hover:bg-blue-50 disabled:opacity-30"><FontAwesomeIcon icon={faChevronRight} /></button></div></div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">{days.map(day => {
            const key = dateKey(day), total = habits.filter(habit => habit.createdOn <= key).length, done = habits.filter(habit => habit.completedDates.includes(key)).length;
            return <button type="button" key={key} disabled={key > todayKey} aria-pressed={key === selectedKey} aria-current={key === todayKey ? 'date' : undefined} aria-label={day.toLocaleDateString('en-GB', { dateStyle: 'full' })} onClick={() => setSelectedDate(day)} className={`flex flex-col items-center gap-2 rounded-xl border py-3 text-xs transition-colors disabled:opacity-40 ${key === selectedKey ? 'border-blue-500 bg-blue-400 shadow-sm' : 'border-blue-200 bg-blue-200 hover:bg-blue-300'}`}><span>{day.toLocaleDateString('en-GB', { weekday: 'short' })}</span><span className="text-base font-semibold">{day.getDate()}</span><span title={`${done}/${total} completed`} aria-label={`${done} of ${total} habits completed`} className={`h-2 w-2 rounded-full ${total > 0 && done === total ? 'bg-blue-900' : 'bg-white'}`} /></button>;
          })}</div></section>
        {habits.length === 0 ? <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-10 text-center"><FontAwesomeIcon icon={faSeedling} className="mb-3 text-3xl text-blue-400" /><h2 className="font-semibold">Build your first habit</h2><p className="mt-2 text-sm text-blue-500">Add a small daily goal and track your progress.</p><button type="button" onClick={() => setForm({ habit: null })} className="mt-4 rounded-lg bg-blue-300 px-4 py-2 text-sm font-semibold">Add habit</button></div> : periods.map(period => {
          const items = habits.filter(habit => habit.period === period);
          if (!items.length) return null;
          return <section key={period} aria-label={`${period} habits`}><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-blue-400" />{period}<span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs">{items.length}</span></h3>
            <ul className="relative space-y-2"><AnimatePresence initial={false} mode="popLayout">{items.map(habit => {
              const done = habit.completedDates.includes(selectedKey), streak = currentStreak(habit, today);
              return <motion.li key={habit.id} layout="position" initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.18 }} className="habit-original-row group rounded-xl border border-blue-200 bg-blue-300 p-3"><div className="flex min-w-0 items-center gap-3">
                <button type="button" disabled={selectedKey > todayKey || selectedKey < habit.createdOn} aria-label={`${done ? 'Unmark' : 'Complete'} ${habit.name} for ${selectedKey}`} aria-pressed={done} onClick={() => toggle(habit, selectedDate)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-900 text-lg text-white hover:bg-blue-800 disabled:opacity-40"><FontAwesomeIcon icon={done ? faCheck : icons[habit.icon]} /></button>
                <div className="min-w-0 flex-1"><h4><button type="button" aria-label={`View streak for ${habit.name}`} aria-pressed={selectedHabit?.id === habit.id} onClick={() => setSelectedHabitId(habit.id)} className={`break-words text-left text-sm font-semibold hover:underline ${selectedHabit?.id === habit.id ? 'underline decoration-blue-500 underline-offset-4' : ''}`}>{habit.name}</button></h4>{streak > 0 && <p className="mt-1 text-[10px] text-blue-800"><FontAwesomeIcon icon={faFire} /> {streak} day streak</p>}</div>
                <div className="habit-week-dots flex shrink-0 items-center gap-1">{days.map(day => {
                  const key = dateKey(day), completed = habit.completedDates.includes(key);
                  return <button key={key} type="button" disabled={key > todayKey || key < habit.createdOn} title={day.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })} aria-label={`${completed ? 'Unmark' : 'Complete'} ${habit.name}, ${day.toLocaleDateString('en-GB', { dateStyle: 'full' })}`} aria-pressed={completed} onClick={() => toggle(habit, day)} className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] transition-colors disabled:opacity-30 ${completed ? 'bg-blue-900 text-white' : 'bg-white text-blue-900 hover:bg-blue-100'} ${key === selectedKey ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-blue-300' : ''}`}>{completed && <FontAwesomeIcon icon={faCheck} />}</button>;
                })}</div>
                <div className="flex shrink-0 gap-0.5"><button type="button" aria-label={`Edit ${habit.name}`} onClick={() => setForm({ habit })} className="rounded-lg p-1.5 text-blue-800 hover:bg-blue-200"><FontAwesomeIcon icon={faPen} className="text-[10px]" /></button><button type="button" aria-label={`Delete ${habit.name}`} onClick={() => persist(habits.filter(item => item.id !== habit.id))} className="rounded-lg p-1.5 text-blue-800 hover:bg-red-50 hover:text-red-500"><FontAwesomeIcon icon={faTrash} className="text-[10px]" /></button></div>
              </div></motion.li>;
            })}</AnimatePresence></ul>
          </section>;
        })}
        <p className="pb-2 text-xs text-blue-500">Habits and progress are saved on this device for your account.</p>
      </>}
    </div></div>
  </main><HabitCalendar habits={habits} habit={selectedHabit} today={today} selectedDate={selectedDate} onSelectHabit={setSelectedHabitId} onSelectDate={setSelectedDate} /></div>;
}
export default function HabitsList() {
  const { user, authLoading } = useAuth();
  if (authLoading) return <p role="status" className="p-6 text-blue-900">Loading habits...</p>;
  if (!user) return <p className="p-6 text-blue-900">Sign in to track your habits.</p>;
  return <HabitDashboard key={user.id} userId={user.id} />;
}
