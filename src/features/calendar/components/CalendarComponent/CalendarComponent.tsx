'use client';
import { useState } from 'react';
interface CalendarProps {
  calendarDate: Date | null;
  setCalendarDate: (date: Date) => void;
}
const sameDay = (a: Date, b: Date | null) => b !== null && a.toDateString() === b.toDateString();
export default function CalendarComponent({ calendarDate, setCalendarDate }: CalendarProps) {
  const [month, setMonth] = useState(() => {
    const date = calendarDate ?? new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const today = new Date();
  const offset = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return <div className="space-y-5">
    <div className="flex gap-2">
      {[['Today', 0], ['Tomorrow', 1], ['In a week', 7]].map(([label, days]) => <button key={label} type="button"
        onClick={() => {
          const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + Number(days));
          setCalendarDate(date);
          setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
        }} className="flex-1 rounded-lg border border-gray-200 px-2 py-2 text-sm text-gray-600 hover:border-blue-400 hover:bg-blue-50 focus-visible:outline-blue-500">{label}</button>)}
    </div>
    <div className="flex items-center justify-between">
      <button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="h-10 w-10 rounded-lg text-xl hover:bg-gray-100">‹</button>
      <h3 aria-live="polite" className="font-semibold text-gray-800">{month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h3>
      <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="h-10 w-10 rounded-lg text-xl hover:bg-gray-100">›</button>
    </div>
    <div className="grid grid-cols-7 gap-1 text-center">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day} className="pb-2 text-xs font-medium text-gray-400">{day}</span>)}
      {Array.from({ length: offset }, (_, i) => <span key={`empty-${i}`} aria-hidden="true" />)}
      {Array.from({ length: days }, (_, i) => {
        const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
        const selected = sameDay(date, calendarDate);
        return <button key={i + 1} type="button" aria-label={date.toLocaleDateString('en-GB', { dateStyle: 'full' })}
          aria-pressed={selected} aria-current={sameDay(date, today) ? 'date' : undefined} onClick={() => setCalendarDate(date)}
          className={`h-10 rounded-lg text-sm focus-visible:outline-blue-500 ${selected ? 'bg-blue-500 font-semibold text-white shadow-sm' : sameDay(date, today) ? 'bg-blue-50 font-semibold text-blue-600 hover:bg-blue-100' : 'text-gray-700 hover:bg-gray-100'}`}>{i + 1}</button>;
      })}
    </div>
  </div>;
}
