'use client';
import { faCheck, faPlus, faUsers, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { supabase } from '@/lib/supabase/client';
import { addGroup } from '@/features/groups/data/groups.repository';
import { getStickers } from '@/lib/supabase/stickers.repository';
import { useAuth } from '@/features/auth/context/AuthContext';
import type { GroupType } from '@/types/GroupType';
import toast from 'react-hot-toast';

interface Props {
  isActiveGroup: boolean;
  setActiveGroup: Dispatch<SetStateAction<boolean>>;
  Mode: string | undefined;
  nameGroup: string | undefined;
  setNameGroup: Dispatch<SetStateAction<string | undefined>>;
  Group: GroupType | null;
  setGroup: Dispatch<SetStateAction<GroupType | null>>;
  refreshFlagGroups: () => void;
}
interface Sticker { id: number; sticker_path: string; }

export default function GroupsModal({ isActiveGroup, setActiveGroup, Mode, nameGroup, setNameGroup, Group, setGroup, refreshFlagGroups }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const [sticker, setSticker] = useState<string | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [stickerError, setStickerError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const editing = Mode === 'Update';

  useEffect(() => {
    if (!isActiveGroup) { dialog.current?.close(); return; }
    setNameGroup(editing && Group ? ((Group as GroupType & { Name?: string }).Name ?? Group.name) : '');
    setSticker(editing ? Group?.image_path ?? null : null);
    setPickerOpen(false);
    setError('');
    dialog.current?.showModal();
    let active = true;
    setStickerError(false);
    getStickers().then(data => {
      if (!active) return;
      setStickers(data ?? []);
      setStickerError(!data);
    }).catch(() => { if (active) setStickerError(true); });
    return () => { active = false; };
  }, [isActiveGroup, editing, Group, setNameGroup]);

  const close = () => {
    if (submitting.current) return;
    setActiveGroup(false);
    setNameGroup('');
    setGroup(null);
  };
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    const name = nameGroup?.trim();
    if (!name) { setError('Enter a group name.'); return; }
    if (!user) { setError('Sign in to create a group.'); return; }
    submitting.current = true;
    setSaving(true);
    setError('');
    try {
      if (editing) {
        if (!Group) throw new Error('No group selected');
        const { data, error: updateError } = await supabase.from('Groups').update({ Name: name, image_path: sticker }).eq('id', Group.id).select('id').single();
        if (updateError || !data) throw updateError ?? new Error('Group was not updated');
      } else {
        const created = await addGroup(name, sticker, user.id);
        if (!created) throw new Error('Group was not created');
      }
      refreshFlagGroups();
      toast.success(editing ? 'Group updated' : 'Group created');
      submitting.current = false;
      close();
    } catch {
      setError('Could not save the group. Please try again.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return <dialog ref={dialog} aria-labelledby="group-modal-title" aria-describedby="group-modal-description"
    onCancel={event => { event.preventDefault(); close(); }}
    onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } }}
    className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-blue-100 bg-white p-0 text-blue-950 shadow-2xl backdrop:bg-blue-950/40 backdrop:backdrop-blur-sm">
    <form onSubmit={save}>
      <header className="flex items-start gap-3 border-b border-blue-100 p-5 sm:p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600"><FontAwesomeIcon icon={faUsers} /></span>
        <div className="min-w-0 flex-1"><h2 id="group-modal-title" className="text-lg font-bold">{editing ? 'Edit group' : 'Create a group'}</h2><p id="group-modal-description" className="mt-1 text-sm text-slate-500">Give your team a name and an icon.</p></div>
        <button type="button" onClick={close} disabled={saving} aria-label="Close group dialog" className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40"><FontAwesomeIcon icon={faXmark} /></button>
      </header>
      <div className="space-y-5 p-5 sm:p-6">
        <div><label htmlFor="group-name" className="mb-2 block text-sm font-semibold">Group name <span className="text-red-500">*</span></label>
          <input id="group-name" autoFocus required disabled={saving} value={nameGroup ?? ''} onChange={event => { setNameGroup(event.target.value); setError(''); }} placeholder="e.g. Design team" aria-invalid={!!error} aria-describedby={error ? 'group-save-error' : undefined} className="w-full rounded-xl border border-blue-200 bg-blue-50/40 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60" />
        </div>
        <div><p className="mb-2 text-sm font-semibold">Group icon <span className="font-normal text-slate-400">(optional)</span></p>
          <div className="flex items-center gap-3"><button type="button" disabled={saving} aria-label="Choose group icon" aria-expanded={pickerOpen} aria-controls="group-icon-picker" onClick={() => setPickerOpen(!pickerOpen)} className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-dashed border-blue-300 bg-blue-50 text-xl text-blue-500 transition hover:border-blue-500 hover:bg-blue-100">
            {sticker ? <Image src={'/img/' + sticker + '.png'} alt="Selected group icon" width={40} height={40} /> : <FontAwesomeIcon icon={faPlus} />}
          </button><div className="text-sm"><button type="button" disabled={saving} onClick={() => setPickerOpen(!pickerOpen)} className="font-semibold text-blue-600 hover:underline">{sticker ? 'Change icon' : 'Choose an icon'}</button><p className="mt-1 text-xs text-slate-500">Make your group easy to recognize.</p>{sticker && <button type="button" disabled={saving} onClick={() => setSticker(null)} className="mt-1 text-xs text-slate-500 hover:text-red-600">Remove icon</button>}</div></div>
          {pickerOpen && <div id="group-icon-picker" className="mt-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
            {stickerError ? <p role="status" className="text-sm text-slate-500">Icons could not be loaded. You can still save your group.</p> : !stickers.length ? <p role="status" className="text-sm text-slate-500">No icons available.</p> : <div className="grid max-h-40 grid-cols-5 gap-2 overflow-y-auto sm:grid-cols-7">{stickers.map(item => <button type="button" key={item.id} disabled={saving} aria-label={'Choose ' + item.sticker_path.replace(/[-_]/g, ' ')} aria-pressed={sticker === item.sticker_path} onClick={() => { setSticker(item.sticker_path); setPickerOpen(false); }} className={'flex h-12 items-center justify-center rounded-lg border transition hover:bg-blue-100 ' + (sticker === item.sticker_path ? 'border-blue-500 bg-blue-100' : 'border-transparent bg-white')}><Image src={'/img/' + item.sticker_path + '.png'} alt="" width={32} height={32} /></button>)}</div>}
          </div>}
        </div>
        {error && <p id="group-save-error" role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
      <footer className="flex items-center justify-end gap-3 border-t border-blue-100 bg-blue-50/40 px-5 py-4 sm:px-6">
        <button type="button" onClick={close} disabled={saving} className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={saving || !nameGroup?.trim() || !user} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><FontAwesomeIcon icon={editing ? faCheck : faPlus} />{saving ? 'Saving...' : editing ? 'Save changes' : 'Create group'}</button>
      </footer>
    </form>
  </dialog>;
}
