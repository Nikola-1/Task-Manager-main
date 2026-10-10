'use client';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faFire, faCheck, faSeedling } from '@fortawesome/free-solid-svg-icons';
import { addDays, dateKey, streakSummary } from '@/features/habits/data/habits';
import type { Habit } from '@/features/habits/data/habits';

interface Props {
  habits: Habit[];
  habit: Habit | null;
  today: Date;
  selectedDate: Date;
  onSelectHabit: (id: string) => void;
  onSelectDate: (date: Date) => void;
}
const formatDate = (key: string) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
export default function HabitCalendar({ habits, habit, today, selectedDate, onSelectHabit, onSelectDate }: Props) {
  const selectedYear = selectedDate.getFullYear(), selectedMonth = selectedDate.getMonth();
  const [month, setMonth] = useState(() => new Date(selectedYear, selectedMonth, 1, 12));
  useEffect(() => { setMonth(new Date(selectedYear, selectedMonth, 1, 12)); }, [selectedYear, selectedMonth]);
  const summary = habit ? streakSummary(habit, today) : null;
  const completed = new Set(summary?.completed ?? []);
  const todayKey = dateKey(today), selectedKey = dateKey(selectedDate), monthKey = dateKey(month).slice(0, 7);
  const monthCount = summary?.completed.filter(day => day.startsWith(monthKey)).length ?? 0;
  const range = summary?.ranges.find(item => item.start <= selectedKey && item.end >= selectedKey);
  const offset = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return <aside className="habits-page flex h-dvh min-w-0 w-full flex-col border-t border-blue-200 bg-blue-50/40 text-blue-900 md:w-1/2 md:border-t-0">
    <header className="shrink-0 border-b border-blue-200 bg-blue-50 px-5 py-4"><h2 className="flex items-center gap-2 text-xl font-bold"><FontAwesomeIcon icon={faFire} className="text-blue-500" />Streak calendar</h2><p className="mt-1 text-sm text-blue-700">See how your daily effort adds up.</p></header>
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
      {!habit ? <div className="rounded-xl border border-dashed border-blue-200 bg-white p-8 text-center"><FontAwesomeIcon icon={faSeedling} className="mb-3 text-3xl text-blue-400" /><h3 className="font-semibold">Your streak starts with one day</h3><p className="mt-2 text-sm text-blue-500">Add a habit on the left to see its calendar and streaks here.</p></div> : <>
        <label className="block text-xs font-semibold text-blue-700">Habit<select aria-label="Habit for streak calendar" value={habit.id} onChange={event => onSelectHabit(event.target.value)} className="mt-2 block w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm font-medium text-blue-900 outline-none focus:border-blue-400">{habits.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <div className="grid grid-cols-3 gap-2">
          {[{ label: 'Current streak', value: summary!.current, unit: 'days' }, { label: 'Longest streak', value: summary!.longest, unit: 'days' }, { label: 'Selected month', value: monthCount, unit: 'completed days' }].map(stat => <div key={stat.label} className="rounded-xl border border-blue-100 bg-white p-3"><p className="text-[11px] text-blue-500">{stat.label}</p><p className="mt-2 text-2xl font-bold tabular-nums">{stat.value}</p><p className="mt-1 text-[10px] text-blue-500">{stat.unit}</p></div>)}
        </div>
        <section className="rounded-xl border border-blue-200 bg-white p-3 sm:p-4" aria-label={`Streak calendar for ${habit.name}`}>
          <div className="mb-4 flex items-center justify-between"><button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))} className="h-9 w-9 rounded-lg hover:bg-blue-50"><FontAwesomeIcon icon={faChevronLeft} /></button><h3 aria-live="polite" className="text-sm font-semibold">{month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h3><button type="button" aria-label="Next month" disabled={dateKey(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12)) > todayKey} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))} className="h-9 w-9 rounded-lg hover:bg-blue-50 disabled:opacity-30"><FontAwesomeIcon icon={faChevronRight} /></button></div>
          <div className="grid grid-cols-7 gap-y-2 text-center">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day} className="pb-2 text-[10px] font-semibold text-blue-500">{day}</span>)}
            {Array.from({ length: offset }, (_, index) => <span key={`empty-${index}`} aria-hidden="true" />)}
            {Array.from({ length: days }, (_, index) => {
              const date = new Date(month.getFullYear(), month.getMonth(), index + 1, 12), key = dateKey(date);
              const done = completed.has(key), before = completed.has(dateKey(addDays(date, -1))), after = completed.has(dateKey(addDays(date, 1)));
              const ineligible = key < habit.createdOn || key > todayKey;
              return <div key={key} className={`${done ? 'bg-blue-100' : ''} ${!before || date.getDay() === 1 || index === 0 ? 'rounded-l-full' : ''} ${!after || date.getDay() === 0 || index === days - 1 ? 'rounded-r-full' : ''}`}>
                <button type="button" disabled={ineligible} aria-pressed={key === selectedKey} aria-current={key === todayKey ? 'date' : undefined} aria-label={`${date.toLocaleDateString('en-GB', { dateStyle: 'full' })}, ${done ? 'completed' : 'not completed'}`}
                  onClick={() => onSelectDate(date)} className={`mx-auto flex h-11 w-9 flex-col items-center justify-center rounded-full text-xs transition-colors sm:w-10 disabled:opacity-25 ${done ? 'bg-blue-300 font-semibold' : 'hover:bg-blue-50'} ${key === selectedKey ? 'ring-2 ring-inset ring-blue-500' : ''} ${key === todayKey ? 'font-bold text-blue-700' : ''}`}><span>{index + 1}</span><span className="mt-0.5 h-3 text-[9px]">{done && <FontAwesomeIcon icon={faCheck} />}</span></button>
              </div>;
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><p className="flex items-center gap-2 text-[11px] text-blue-500"><span className="h-2 w-5 rounded-full bg-blue-300" />Connected days form a streak</p><button type="button" onClick={() => { setMonth(new Date(today.getFullYear(), today.getMonth(), 1, 12)); onSelectDate(today); }} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold hover:bg-blue-100">Today</button></div>
        </section>
        <div aria-live="polite" className="rounded-xl border border-blue-100 bg-white p-4"><h3 className="text-sm font-semibold">{selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</h3><p className="mt-2 text-sm text-blue-600">{range ? `${range.length} day streak: ${formatDate(range.start)} - ${formatDate(range.end)}.` : selectedKey < habit.createdOn ? 'This date is before you started this habit.' : selectedKey === todayKey ? 'Complete your habit today to continue your streak.' : 'No completion recorded for this day.'}</p><p className="mt-2 text-xs text-blue-400">Mark days in the habit list on the left.</p></div>
        <section><h3 className="mb-2 text-sm font-semibold">Recent streaks</h3>{summary!.ranges.length ? <ul className="space-y-2">{summary!.ranges.slice(-4).reverse().map(item => <li key={item.start} className="flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-white px-3 py-2.5 text-xs"><span>{formatDate(item.start)} - {formatDate(item.end)}</span><span className="shrink-0 rounded-full bg-blue-100 px-2 py-1 font-semibold">{item.length} {item.length === 1 ? 'day' : 'days'}</span></li>)}</ul> : <p className="text-xs text-blue-500">Your first completed day starts your first streak.</p>}</section>
      </>}
    </div>
  </aside>;
}
