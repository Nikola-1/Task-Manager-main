'use client';
import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlus, faTag, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useScope } from '@/features/groups/context/ScopeContext';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface Props {
  isActive: boolean;
  setActive: Dispatch<SetStateAction<boolean>>;
  Mode: string | undefined;
  onUpdate: () => void;
  selectedTag: object | null;
  setSelectedTag: Dispatch<SetStateAction<object | null>>;
}
interface Tag { id: number; name: string; color: string | null; parent_id: number | null; }
const colors = [
  { value: '#991b1b', name: 'Red' }, { value: '#3730a3', name: 'Indigo' },
  { value: '#9a3412', name: 'Orange' }, { value: '#1e40af', name: 'Blue' },
  { value: '#166534', name: 'Green' },
];

export default function TagModalComponent({ isActive, setActive, Mode, onUpdate, selectedTag, setSelectedTag }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [parent, setParent] = useState<number | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const { user } = useAuth();
  const { groupId } = useScope();
  const editing = Mode === 'Update';
  const tag = selectedTag as Tag | null;
  const hasChildren = editing && tags.some(item => item.parent_id === tag?.id);

  useEffect(() => {
    if (!isActive) { dialog.current?.close(); return; }
    setName(editing ? tag?.name ?? '' : '');
    setColor(editing ? tag?.color ?? null : null);
    setParent(editing ? tag?.parent_id ?? null : null);
    setError('');
    dialog.current?.showModal();
  }, [isActive, editing, tag]);

  useEffect(() => {
    if (!isActive || !user) return;
    let active = true;
    setLoading(true); setLoadError(''); setTags([]);
    const load = async () => {
      const query = supabase.from('Tags').select('id, name, color, parent_id').order('id');
      const { data, error: fetchError } = await (groupId != null ? query.eq('group_id', groupId) : query.eq('User_id', user.id).is('group_id', null));
      if (fetchError) throw fetchError;
      if (active) setTags(data ?? []);
    };
    load().catch(() => { if (active) setLoadError('Could not load parent tags. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isActive, user, groupId, retry]);

  const close = () => {
    if (submitting.current) return;
    setActive(false); setSelectedTag(null);
  };
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current || loading || loadError) return;
    const trimmed = name.trim();
    if (!trimmed) { setError('Enter a tag name.'); return; }
    if (!user) { setError('Sign in to save a tag.'); return; }
    if (parent !== null && (hasChildren || !tags.some(item => item.id === parent && (!editing || item.id !== tag?.id) && item.parent_id === null))) {
      setError('Choose a valid parent tag.'); return;
    }
    submitting.current = true; setSaving(true); setError('');
    try {
      if (editing) {
        if (!tag) throw new Error('No tag selected');
        const { data, error: updateError } = await supabase.from('Tags').update({ name: trimmed, color, parent_id: parent }).eq('User_id', user.id).eq('id', tag.id).select('id').single();
        if (updateError || !data) throw updateError ?? new Error('Tag was not updated');
      } else {
        const { data, error: insertError } = await supabase.from('Tags').insert({ name: trimmed, color, parent_id: parent, User_id: user.id, group_id: groupId }).select('id').single();
        if (insertError || !data) throw insertError ?? new Error('Tag was not created');
      }
      onUpdate(); toast.success(editing ? 'Tag updated' : 'Tag created');
      submitting.current = false; close();
    } catch { setError('Could not save the tag. Please try again.'); }
    finally { submitting.current = false; setSaving(false); }
  };

  return <dialog ref={dialog} aria-labelledby="tag-modal-title" aria-describedby="tag-modal-description"
    onCancel={event => { event.preventDefault(); close(); }}
    onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } }}
    className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-blue-100 bg-white p-0 text-blue-950 shadow-2xl backdrop:bg-blue-950/40 backdrop:backdrop-blur-sm">
    <form onSubmit={save}>
      <header className="flex items-start gap-3 border-b border-blue-100 p-5 sm:p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600"><FontAwesomeIcon icon={faTag} /></span>
        <div className="min-w-0 flex-1"><h2 id="tag-modal-title" className="text-lg font-bold">{editing ? 'Edit tag' : 'Create a tag'}</h2><p id="tag-modal-description" className="mt-1 text-sm text-slate-500">Organize your tasks with a name and a color.</p></div>
        <button type="button" onClick={close} disabled={saving} aria-label="Close tag dialog" className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40"><FontAwesomeIcon icon={faXmark} /></button>
      </header>
      <div className="space-y-5 p-5 sm:p-6">
        <div><label htmlFor="tag-name" className="mb-2 block text-sm font-semibold">Tag name <span className="text-red-500">*</span></label><input id="tag-name" autoFocus required disabled={saving} value={name} onChange={event => { setName(event.target.value); setError(''); }} placeholder="e.g. Important" className="w-full rounded-xl border border-blue-200 bg-blue-50/40 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60" /></div>
        <fieldset disabled={saving}><legend className="mb-3 text-sm font-semibold">Color <span className="font-normal text-slate-400">(optional)</span></legend>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" aria-label="No color" aria-pressed={color === null} onClick={() => setColor(null)} className={'flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white text-slate-400 ' + (color === null ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-400')}><FontAwesomeIcon icon={faXmark} /></button>
            {colors.map(option => <button type="button" key={option.value} aria-label={option.name} aria-pressed={color === option.value} onClick={() => setColor(option.value)} style={{ backgroundColor: option.value }} className={'flex h-9 w-9 items-center justify-center rounded-full border-2 text-white transition hover:ring-2 hover:ring-blue-200 ' + (color === option.value ? 'border-white ring-2 ring-blue-500' : 'border-transparent')}>{color === option.value && <FontAwesomeIcon icon={faCheck} />}</button>)}
          </div>
          <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-xs text-slate-500"><input type="color" aria-label="Custom tag color" value={color ?? '#1e40af'} onChange={event => setColor(event.target.value)} className="h-8 w-10 cursor-pointer rounded border border-blue-200 bg-white p-0.5" />Custom color{color && <span className="font-mono">{color.toUpperCase()}</span>}</label>
        </fieldset>
        <div><label htmlFor="tag-parent" className="mb-2 block text-sm font-semibold">Parent tag</label><select id="tag-parent" disabled={saving || loading || !!loadError || hasChildren} value={parent ?? ''} onChange={event => { setParent(event.target.value ? Number(event.target.value) : null); setError(''); }} aria-describedby="tag-parent-help" className="w-full rounded-xl border border-blue-200 bg-blue-50/40 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"><option value="">{loading ? 'Loading tags...' : 'None — standalone tag'}</option>{tags.filter(item => item.parent_id === null && (!editing || item.id !== tag?.id)).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><p id="tag-parent-help" className="mt-2 text-xs text-slate-500">{hasChildren ? 'A tag with subtags must stay at the top level.' : 'Choose a parent to create a subtag, or keep it standalone.'}</p>
          {loadError && <div role="alert" className="mt-2 text-sm text-red-600">{loadError} <button type="button" onClick={() => setRetry(value => value + 1)} className="font-semibold underline">Retry</button></div>}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/40 px-3 py-3 text-sm"><span className="text-xs text-slate-500">Preview</span><span className="ml-auto flex min-w-0 items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-1.5"><FontAwesomeIcon icon={faTag} className="shrink-0 text-blue-500" /><span className="truncate font-medium">{name.trim() || 'Your tag'}</span>{color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />}</span></div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
      <footer className="flex items-center justify-end gap-3 border-t border-blue-100 bg-blue-50/40 px-5 py-4 sm:px-6">
        <button type="button" onClick={close} disabled={saving} className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={saving || loading || !!loadError || !name.trim() || !user} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><FontAwesomeIcon icon={editing ? faCheck : faPlus} />{saving ? 'Saving...' : editing ? 'Save changes' : 'Create tag'}</button>
      </footer>
    </form>
  </dialog>;
}
