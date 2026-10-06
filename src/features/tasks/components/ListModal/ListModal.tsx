'use client';

import { faSmile, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useScope } from '@/features/groups/context/ScopeContext';
import { getStickers } from '@/lib/supabase/stickers.repository';

interface Sticker { id: number; sticker_path: string; }
interface Category { id: number; name: string; sticker_id?: number | null; Stickers?: Sticker | null; }
interface ModalProps {
  setActive: React.Dispatch<React.SetStateAction<boolean>>;
  isActive: boolean;
  onUpdate: () => void;
  setTaskFilter: React.Dispatch<React.SetStateAction<string>>;
  setFilterImage: React.Dispatch<React.SetStateAction<string>>;
  editListItem: object | null;
  setEditListItem: React.Dispatch<React.SetStateAction<object | null>>;
  Mode: string | undefined;
  nameCategory: string | undefined;
  setnameCategory: React.Dispatch<React.SetStateAction<string | undefined>>;
  categoryId?: number | null;
}

function CategoryDialog({ setActive, onUpdate, setTaskFilter, setFilterImage, editListItem,
  setEditListItem, Mode, setnameCategory, categoryId }: Omit<ModalProps, 'isActive'>) {
  const editing = Mode === 'Update';
  const category = editing ? editListItem as Category | null : null;
  const [name, setName] = useState(category?.name ?? '');
  const [sticker, setSticker] = useState<Sticker | null>(category?.Stickers ?? null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loadingIcons, setLoadingIcons] = useState(true);
  const [iconError, setIconError] = useState(false);
  const [retryIcons, setRetryIcons] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savingRef = useRef(false);
  const dialog = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const nameId = useId();
  const errorId = useId();
  const { user } = useAuth();
  const { groupId } = useScope();

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    input.current?.focus();
    return () => { document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingIcons(true);
    setIconError(false);
    getStickers().then(data => {
      if (cancelled) return;
      if (data) setStickers(data as Sticker[]);
      else setIconError(true);
    }).catch(() => { if (!cancelled) setIconError(true); })
      .finally(() => { if (!cancelled) setLoadingIcons(false); });
    return () => { cancelled = true; };
  }, [retryIcons]);

  const close = () => {
    if (savingRef.current) return;
    setActive(false);
    setEditListItem(null);
    setnameCategory('');
  };
  const save = async () => {
    if (savingRef.current) return;
    const trimmedName = name.trim();
    if (!trimmedName) { setError('Enter a category name.'); input.current?.focus(); return; }
    if (!user?.id || (editing && !category?.id)) { setError('Could not save this category. Please reopen the dialog.'); return; }
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      const payload = { name: trimmedName, sticker_id: sticker?.id ?? null };
      const result = editing
        ? await supabase.from('Categories').update(payload).eq('id', category!.id).eq('user_id', user.id).select('id').single()
        : await supabase.from('Categories').insert({ ...payload, user_id: user.id, group_id: groupId ?? null }).select('id').single();
      if (result.error || !result.data) throw new Error('Save failed');
      if (editing && categoryId === category?.id) {
        setTaskFilter(trimmedName);
        setFilterImage(sticker?.sticker_path ?? '');
      }
      onUpdate();
      savingRef.current = false;
      close();
    } catch {
      setError('Could not save the category. Please try again.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/40 p-4 backdrop-blur-sm"
    onClick={event => { if (event.currentTarget === event.target) close(); }}>
    <form ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={saving}
      onSubmit={event => { event.preventDefault(); void save(); }}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.stopPropagation(); close(); }
        if (event.key === 'Tab') {
          const controls = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)');
          if (!controls?.length) return;
          const first = controls[0], last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }} className="flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-2xl">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-blue-200 bg-blue-300 px-5 py-4">
        <div><h2 id={titleId} className="text-lg font-semibold text-blue-900">{editing ? 'Edit category' : 'Add category'}</h2>
          <p className="mt-1 text-sm text-blue-800">Keep related tasks together.</p></div>
        <button type="button" aria-label="Close category dialog" disabled={saving} onClick={close}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-900 hover:bg-blue-200 focus-visible:outline-blue-500 disabled:opacity-40"><FontAwesomeIcon icon={faXmark} /></button>
      </header>
      <div className="min-h-0 space-y-5 overflow-y-auto p-5">
        <div>
          <label htmlFor={nameId} className="mb-2 block text-sm font-semibold text-blue-900">Category name</label>
          <input ref={input} id={nameId} value={name} disabled={saving} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined}
            onChange={event => { setName(event.target.value); setError(''); }} placeholder="e.g. Work, Personal, Ideas"
            className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-blue-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-60" />
        </div>
        <fieldset disabled={saving}>
          <legend className="mb-2 text-sm font-semibold text-blue-900">Category icon <span className="font-normal text-slate-400">(optional)</span></legend>
          {loadingIcons ? <p role="status" className="py-3 text-sm text-slate-500">Loading icons...</p> : iconError ?
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">Icons could not be loaded. <button type="button" onClick={() => setRetryIcons(value => value + 1)} className="font-semibold underline">Try again</button></div> : null}
          <div className="grid max-h-44 grid-cols-6 gap-2 overflow-y-auto rounded-xl border border-blue-100 bg-blue-50/50 p-2 sm:grid-cols-7">
            <button type="button" aria-label="No category icon" aria-pressed={sticker === null} onClick={() => setSticker(null)}
              className={`flex h-11 items-center justify-center rounded-lg border text-xs ${sticker === null ? 'border-blue-400 bg-blue-200 text-blue-900' : 'border-transparent bg-white text-slate-500 hover:bg-blue-100'}`}>None</button>
            {stickers.map(item => <button type="button" key={item.id} aria-label={`Choose ${item.sticker_path} icon`} aria-pressed={sticker?.id === item.id}
              onClick={() => setSticker(item)} className={`flex h-11 items-center justify-center rounded-lg border transition focus-visible:outline-blue-500 ${sticker?.id === item.id ? 'border-blue-400 bg-blue-200' : 'border-transparent bg-white hover:bg-blue-100'}`}>
              <Image src={`/img/${item.sticker_path}.png`} alt="" width={30} height={30} />
            </button>)}
          </div>
        </fieldset>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
          <p className="mb-2 text-xs font-medium text-blue-800">Preview</p>
          <div className="flex min-w-0 items-center gap-3 rounded-lg bg-white p-3 text-sm font-semibold text-blue-900">
            {sticker ? <Image src={`/img/${sticker.sticker_path}.png`} alt="" width={28} height={28} /> : <FontAwesomeIcon icon={faSmile} className="text-xl text-blue-400" />}
            <span className="min-w-0 break-words">{name.trim() || 'Category name'}</span>
          </div>
        </div>
        {error && <p id={errorId} role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
      <footer className="flex shrink-0 justify-end gap-3 border-t border-blue-100 bg-blue-50 px-5 py-4">
        <button type="button" disabled={saving} onClick={close} className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-100 disabled:opacity-40">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-lg border border-blue-300 bg-blue-300 px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-400 disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Save changes' : 'Add category'}</button>
      </footer>
    </form>
  </div>, document.body);
}

export default function ListModal({ isActive, ...props }: ModalProps) {
  const { groupId } = useScope();
  const { user } = useAuth();
  const id = props.Mode === 'Update' ? (props.editListItem as Category | null)?.id : 'new';
  return isActive ? <CategoryDialog key={`${user?.id}-${groupId}-${id}`} {...props} /> : null;
}
