import { useEffect, useId, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { validateTaskDateRange, type TaskDateRange } from '@/features/tasks/data/task-date-range';

interface Props {
  value: TaskDateRange | null;
  onApply: (range: TaskDateRange) => void;
  onClear: () => void;
}

export default function TaskDateRangeFilter({ value, onApply, onClear }: Props) {
  const id = useId();
  const [from, setFrom] = useState(value?.from ?? '');
  const [to, setTo] = useState(value?.to ?? '');
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const firstInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    firstInput.current?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const fieldClass = 'min-w-0 w-full rounded-lg border border-blue-200 bg-white px-2 py-2 text-sm text-blue-900 focus-visible:outline-blue-500';
  return <div ref={root} className="relative mx-3 mb-1 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-blue-800" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }} onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
  }}>
    <span className="flex items-center gap-2 font-medium"><FontAwesomeIcon icon={faCalendar} className="text-blue-400" />Filter by date</span>
    <button ref={trigger} type="button" aria-expanded={open} aria-controls={open ? `${id}-panel` : undefined}
      onClick={() => setOpen(current => !current)}
      className="flex min-w-0 items-center gap-2.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-800 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
      <span>{value ? `${value.from} – ${value.to}` : 'Choose dates'}</span>
      <FontAwesomeIcon icon={faChevronDown} className={`h-3 w-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <form id={`${id}-panel`} aria-label="Filter by task date" className="absolute right-0 top-full z-40 mt-2 w-72 max-w-full rounded-xl border border-blue-100 bg-white p-3 text-blue-900 shadow-xl shadow-blue-950/10" onSubmit={event => {
    event.preventDefault();
    const next = { from, to };
    const message = validateTaskDateRange(next);
    setError(message);
    if (!message) { setOpen(false); trigger.current?.focus(); onApply(next); }
  }}>
    <fieldset>
      <legend className="mb-2 text-xs font-semibold">Filter by task date</legend>
      <div className="grid grid-cols-2 gap-2">
        <label className="min-w-0 text-xs">From<input ref={firstInput} className={fieldClass} type="date" required max="9999-12-31" value={from} onChange={event => { setFrom(event.target.value); setError(null); }} aria-describedby={error ? `${id}-error` : undefined} /></label>
        <label className="min-w-0 text-xs">To<input className={fieldClass} type="date" required min={from || undefined} max="9999-12-31" value={to} onChange={event => { setTo(event.target.value); setError(null); }} aria-describedby={error ? `${id}-error` : undefined} /></label>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="submit" className="rounded-lg bg-blue-900 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800">Apply dates</button>
        {(value || from || to) && <button type="button" className="rounded-lg px-3 py-2 text-xs hover:bg-blue-100" onClick={() => { setFrom(''); setTo(''); setError(null); setOpen(false); trigger.current?.focus(); if (value) onClear(); }}>Clear</button>}
      </div>
      {error && <p id={`${id}-error`} role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
      {value && <p role="status" className="mt-2 text-xs">{value.from} – {value.to}, including both dates. Active and completed tasks.</p>}
    </fieldset>
  </form>}
  </div>;
}
