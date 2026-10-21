'use client';
import { faMagnifyingGlass, faUserPlus, faUserMinus, faUsers, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { GroupType } from '@/types/GroupType';
import toast from 'react-hot-toast';

interface Props {
  Mode: string | undefined;
  setMode: Dispatch<SetStateAction<string | undefined>>;
  Group: GroupType | null;
  setGroup: Dispatch<SetStateAction<GroupType | null>>;
  isActiveUser: boolean;
  setActiveUser: Dispatch<SetStateAction<boolean>>;
  refreshFlagGroups: () => void;
}
interface Member { id: number; Name: string | null; Surname: string | null; Username: string | null; email: string | null; }

export default function UsersModal({ Mode, setMode, Group, setGroup, isActiveUser, setActiveUser, refreshFlagGroups }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const [users, setUsers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const removing = Mode === 'Delete';
  const groupName = (Group as (GroupType & { Name?: string }) | null)?.Name ?? Group?.name ?? 'Group';

  useEffect(() => {
    if (!isActiveUser) { dialog.current?.close(); return; }
    dialog.current?.showModal();
    setSearch(''); setSelected([]); setError('');
  }, [isActiveUser, Group?.id, removing]);

  useEffect(() => {
    if (!isActiveUser || !Group) return;
    let active = true;
    setLoading(true); setLoadError(''); setUsers([]);
    const load = async () => {
      const [membersResult, usersResult] = await Promise.all([
        supabase.from('Users_Groups').select('id_user').eq('id_group', Group.id),
        supabase.from('Users').select('id, Name, Surname, Username, email').order('Username'),
      ]);
      if (membersResult.error || usersResult.error) throw new Error('Could not load members');
      const memberIds = new Set((membersResult.data ?? []).map(member => member.id_user));
      const ownerId = (Group as GroupType & { Admin?: number }).Admin ?? Group.owner_id;
      const candidates = (usersResult.data ?? []).filter(person => removing ? memberIds.has(person.id) && person.id !== ownerId : !memberIds.has(person.id) && person.id !== ownerId);
      if (active) setUsers(candidates);
    };
    load().catch(() => { if (active) setLoadError('Could not load users. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isActiveUser, Group, removing, retry]);

  const close = () => {
    if (submitting.current) return;
    setActiveUser(false); setSelected([]); setGroup(null); setMode(undefined);
  };
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current || !Group || !selected.length || loading || loadError) return;
    submitting.current = true; setSaving(true); setError('');
    try {
      const result = removing
        ? await supabase.from('Users_Groups').delete().eq('id_group', Group.id).in('id_user', selected).select('id_user')
        : await supabase.from('Users_Groups').insert(selected.map(id => ({ id_group: Group.id, id_user: id }))).select('id_user');
      if (result.error || result.data?.length !== selected.length) throw new Error('Could not save all members');
      refreshFlagGroups();
      toast.success(removing ? 'Members removed' : 'Members added');
      submitting.current = false; close();
    } catch { setError('Could not save members. Please try again.'); }
    finally { submitting.current = false; setSaving(false); }
  };
  const query = search.trim().toLowerCase();
  const filtered = users.filter(person => [person.Name, person.Surname, person.Username, person.email, `${person.Name ?? ''} ${person.Surname ?? ''}`].some(value => value?.toLowerCase().includes(query)));

  return <dialog ref={dialog} aria-labelledby="members-modal-title" aria-describedby="members-modal-description"
    onCancel={event => { event.preventDefault(); close(); }}
    onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } }}
    className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-blue-100 bg-white p-0 text-blue-950 shadow-2xl backdrop:bg-blue-950/40 backdrop:backdrop-blur-sm">
    <form onSubmit={save} className="flex max-h-[calc(100dvh-2rem)] flex-col">
      <header className="flex shrink-0 items-start gap-3 border-b border-blue-100 p-5 sm:p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600"><FontAwesomeIcon icon={removing ? faUserMinus : faUserPlus} /></span>
        <div className="min-w-0 flex-1"><h2 id="members-modal-title" className="text-lg font-bold">{removing ? 'Remove members' : 'Add members'}</h2><p id="members-modal-description" className="mt-1 text-sm text-slate-500">{removing ? 'Select the people to remove from this group.' : 'Choose people to join your group.'}</p></div>
        <button type="button" onClick={close} disabled={saving} aria-label="Close members dialog" className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40"><FontAwesomeIcon icon={faXmark} /></button>
      </header>
      <div className="shrink-0 space-y-4 px-5 pt-5 sm:px-6">
        <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-500">{Group?.image_path ? <Image src={'/img/' + Group.image_path + '.png'} alt="" width={28} height={28} /> : <FontAwesomeIcon icon={faUsers} />}</span><div className="min-w-0"><p className="text-xs text-slate-500">Group</p><p className="truncate text-sm font-semibold">{groupName}</p></div></div>
        <label className="flex items-center gap-3 rounded-xl border border-blue-200 px-3 py-3 text-slate-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"><FontAwesomeIcon icon={faMagnifyingGlass} /><input autoFocus type="search" aria-label="Search users" placeholder="Search by name, username or email..." value={search} onChange={event => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-blue-950 outline-none placeholder:text-slate-400" /></label>
        <div className="flex items-center justify-between text-xs"><span className="text-slate-500">{loading ? 'Loading users...' : `${filtered.length} ${filtered.length === 1 ? 'person' : 'people'} available`}</span><span role="status" className="font-semibold text-blue-600">{selected.length} selected</span></div>
      </div>
      <div aria-busy={loading} className="min-h-0 flex-1 overflow-y-auto px-5 py-3 sm:px-6" style={{ maxHeight: '320px' }}>
        {loading ? <p role="status" className="py-10 text-center text-sm text-slate-500">Loading users...</p> : loadError ? <div role="alert" className="py-8 text-center"><p className="text-sm text-red-600">{loadError}</p><button type="button" onClick={() => setRetry(value => value + 1)} className="mt-3 text-sm font-semibold text-blue-600 hover:underline">Try again</button></div> : !filtered.length ? <div className="py-8 text-center"><FontAwesomeIcon icon={faUsers} className="mb-3 text-2xl text-blue-300" /><p className="text-sm font-semibold">{query ? 'No matching users' : removing ? 'No members to remove' : 'No new users to add'}</p><p className="mt-1 text-xs text-slate-500">{query ? 'Try a different name or email.' : removing ? 'The group owner stays in the group.' : 'Existing members are already part of this group.'}</p></div> : <ul className="space-y-2" aria-label="Available users">{filtered.map(person => {
          const checked = selected.includes(person.id);
          const name = `${person.Name ?? ''} ${person.Surname ?? ''}`.trim() || person.Username || 'User';
          return <li key={person.id}><label className={'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition hover:bg-blue-50 ' + (checked ? 'border-blue-400 bg-blue-50' : 'border-blue-100 bg-white')}>
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{name.slice(0, 1).toUpperCase()}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{name}</span>{person.Username && <span className="block truncate text-xs text-blue-600">@{person.Username}</span>}{person.email && <span className="block truncate text-xs text-slate-500">{person.email}</span>}</span>
            <input type="checkbox" checked={checked} disabled={saving} aria-label={(removing ? 'Remove ' : 'Add ') + name} onChange={() => { setSelected(previous => checked ? previous.filter(id => id !== person.id) : [...previous, person.id]); setError(''); }} className="h-4 w-4 shrink-0 accent-blue-600" />
          </label></li>;
        })}</ul>}
      </div>
      {error && <p role="alert" className="mx-5 mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:mx-6">{error}</p>}
      <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-blue-100 bg-blue-50/40 px-5 py-4 sm:px-6">
        <button type="button" onClick={close} disabled={saving} className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={saving || loading || !!loadError || !selected.length || !Group} className={'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ' + (removing ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700')}><FontAwesomeIcon icon={removing ? faUserMinus : faUserPlus} />{saving ? 'Saving...' : `${removing ? 'Remove' : 'Add'}${selected.length ? ` (${selected.length})` : ''}`}</button>
      </footer>
    </form>
  </dialog>;
}
