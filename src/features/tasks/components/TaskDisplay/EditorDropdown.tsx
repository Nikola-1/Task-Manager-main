'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

interface DropdownOption {
  value: string;
  label: string;
  style?: CSSProperties;
}
interface EditorDropdownProps {
  label: string;
  icon: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
}

export default function EditorDropdown({ label, icon, value, options, onChange }: EditorDropdownProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const selected = options.find(option => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);
  useEffect(() => {
    if (open) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const show = () => {
    setActive(Math.max(0, options.findIndex(option => option.value === value)));
    setOpen(true);
  };
  const choose = (index: number) => {
    setOpen(false);
    onChange(options[index].value);
  };
  return <div ref={root} className="editor-dropdown" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }}>
    <button ref={trigger} type="button" className={`editor-dropdown-trigger ${open ? 'is-open' : ''}`}
      aria-label={`${label}: ${selected.label}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined}
      onMouseDown={event => event.preventDefault()}
      onClick={() => { if (open) setOpen(false); else show(); }}
      onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show(); }
      }}>
      <span aria-hidden="true" className="editor-dropdown-icon">{icon}</span>
      <span className="editor-dropdown-value">{selected.label}</span>
      <svg aria-hidden="true" viewBox="0 0 16 16" className="editor-dropdown-chevron"><path d="m4 6 4 4 4-4" /></svg>
    </button>
    {open && <div ref={list} id={id} role="listbox" aria-label={label} tabIndex={-1}
      aria-activedescendant={`${id}-${active}`} className="editor-dropdown-menu"
      onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          setActive(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
        } else if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault(); setActive(event.key === 'Home' ? 0 : options.length - 1);
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault(); choose(active);
        } else if (event.key === 'Escape') {
          event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus();
        } else if (event.key === 'Tab') { setOpen(false); trigger.current?.focus(); }
      }}>
      <p className="editor-dropdown-label" aria-hidden="true">{label}</p>
      {options.map((option, index) => <div key={option.value} id={`${id}-${index}`} role="option"
        aria-selected={option.value === value} data-index={index}
        className={`editor-dropdown-option ${index === active ? 'is-focused' : ''} ${option.value === value ? 'is-selected' : ''}`}
        onMouseEnter={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}>
        <span style={option.style}>{option.label}</span>
        <span aria-hidden="true" className="editor-dropdown-check">{option.value === value ? '✓' : ''}</span>
      </div>)}
    </div>}
  </div>;
}
