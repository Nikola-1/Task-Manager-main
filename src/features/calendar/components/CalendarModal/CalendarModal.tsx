'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CalendarComponent from '@/features/calendar/components/CalendarComponent/CalendarComponent';
interface ModalProps {
  setActive: React.Dispatch<React.SetStateAction<boolean>>;
  isActive: boolean;
  DateInherited: Date | null;
  setDate: React.Dispatch<React.SetStateAction<Date | null>>;
}
function DateDialog({ setActive, DateInherited, setDate }: Omit<ModalProps, 'isActive'>) {
  const [draft, setDraft] = useState(DateInherited ?? new Date());
  const dialog = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    onClick={event => { if (event.target === event.currentTarget) setActive(false); }}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}
      className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
      onKeyDown={event => {
        if (event.key === 'Escape') { event.stopPropagation(); setActive(false); }
        if (event.key === 'Tab') {
          const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
          if (!buttons?.length) return;
          const first = buttons[0], last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div><h2 id={titleId} className="text-lg font-semibold text-gray-900">Task date</h2>
          <p className="mt-1 text-sm text-gray-500">Choose when this task is due.</p></div>
        <button type="button" aria-label="Close date picker" onClick={() => setActive(false)} className="h-8 w-8 rounded-lg text-xl text-gray-400 hover:bg-gray-100">×</button>
      </div>
      <CalendarComponent calendarDate={draft} setCalendarDate={setDraft} />
      <p aria-live="polite" className="mt-5 rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-600">
        {draft.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      <div className="mt-5 flex gap-3 border-t border-gray-100 pt-4">
        <button type="button" onClick={() => setActive(false)} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
        <button type="button" onClick={() => { setDate(draft); setActive(false); }} className="flex-1 rounded-lg bg-blue-500 py-2.5 text-sm font-medium text-white hover:bg-blue-600">Save date</button>
      </div>
    </div>
  </div>, document.body);
}
export default function CalendarModal({ isActive, ...props }: ModalProps) {
  return isActive ? <DateDialog {...props} /> : null;
}
