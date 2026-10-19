'use client';
import { useEffect, useId, useRef, useState } from 'react';
import type { TaskSort } from '@/features/tasks/data/task-sort';

const options = [
  { value: 'default', label: 'Default order', icon: 'bars' },
  { value: 'date-asc', label: 'Date: earliest first', icon: 'down' },
  { value: 'date-desc', label: 'Date: latest first', icon: 'up' },
  { value: 'priority-desc', label: 'Priority: highest first', icon: 'down' },
  { value: 'priority-asc', label: 'Priority: lowest first', icon: 'up' },
] as const;

function PixelIcon({ icon, className = '' }: { icon: 'bars' | 'down' | 'up' | 'check' | 'chevron'; className?: string }) {
  const paths = {
    bars: 'M2 3h12v2H2z M2 7h12v2H2z M2 11h12v2H2z',
    down: 'M3 2h2v8h2v2H5v2H3v-2H1v-2h2z M8 3h6v2H8z M8 7h4v2H8z M8 11h2v2H8z',
    up: 'M3 2h2v2h2v2H5v8H3V6H1V4h2z M8 3h2v2H8z M8 7h4v2H8z M8 11h6v2H8z',
    check: 'M2 7h2v2h2v2h2V9h2V7h2V5h2v4h-2v2h-2v2H6v-2H4V9H2z',
    chevron: 'M2 5h2v2h2v2h4V7h2V5h2v4h-2v2h-2v2H6v-2H4V9H2z',
  };
  return <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill={icon === 'check' ? 'none' : 'currentColor'} style={{ color: 'rgb(64, 83, 127)' }} shapeRendering={icon === 'check' ? 'auto' : 'crispEdges'} className={`shrink-0 ${className}`}>
    {icon === 'check' ? <path d="m3 8 3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> : <path d={paths[icon]} />}
  </svg>;
}

export default function TaskSortDropdown({ value, onChange }: { value: TaskSort; onChange: (value: TaskSort) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const selected = options.find(option => option.value === value) ?? options[0];
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  return <div ref={root} className="relative min-w-0" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button ref={trigger} data-task-sort-trigger type="button" aria-label={'Sort tasks: ' + selected.label} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
      onClick={() => setOpen(current => !current)} onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); }
      }}
      className={'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 ' + (open ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-blue-200 bg-white text-blue-800 hover:border-blue-300 hover:bg-blue-50')}>
      <PixelIcon icon={selected.icon} className="text-blue-400" />
      <span className="min-w-0 flex-1 text-left">{selected.label}</span>
      <PixelIcon icon="chevron" className={'h-3 w-3 text-blue-400 transition-transform duration-200 ' + (open ? 'rotate-180' : '')} />
    </button>
    {open && <div ref={menu} id={menuId} role="menu" aria-label="Sort tasks" className="absolute right-0 top-full z-40 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-blue-100 bg-white p-1.5 shadow-xl shadow-blue-950/10"
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); return; }
        const buttons = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
          buttons[next]?.focus();
        }
      }}>
      <p className="px-2.5 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-blue-400">Sort tasks</p>
      {options.map(option => <button type="button" role="menuitemradio" aria-checked={value === option.value} tabIndex={-1} key={option.value}
        onClick={() => { onChange(option.value); setOpen(false); trigger.current?.focus(); }}
        className={'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-xs text-slate-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-300 ' + (value === option.value ? 'bg-blue-50 font-semibold' : 'hover:bg-blue-50')}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center"><PixelIcon icon={option.icon} /></span>
        <span className="flex-1">{option.label}</span>
        {value === option.value && <PixelIcon icon="check" className="h-5 w-5" />}
      </button>)}
    </div>}
  </div>;
}
