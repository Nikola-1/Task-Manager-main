'use client';
import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faMagnifyingGlass, faUsers, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/features/auth/context/AuthContext';
import { deleteGroup, getGroups } from '@/features/groups/data/groups.repository';
import type { GroupType } from '@/types/GroupType';
interface GroupCard extends GroupType { Name?: string; Admin?: number; ownerId?: number; Users_Groups?: unknown[]; }
interface Props {
  Mode: string | undefined;
  EditOn: boolean;
  AddUserOn: boolean;
  DeleteOn: boolean;
  setGroup: Dispatch<SetStateAction<GroupType | null>>;
  setActiveGroup: Dispatch<SetStateAction<boolean>>;
  setActiveUser: Dispatch<SetStateAction<boolean>>;
  setEditOn: Dispatch<SetStateAction<boolean>>;
  setAddUserOn: Dispatch<SetStateAction<boolean>>;
  setDeleteOn: Dispatch<SetStateAction<boolean>>;
  refreshFlagGroups: () => void;
  refreshVersion: boolean;
}
export default function GroupsComponent({ Mode, EditOn, AddUserOn, DeleteOn, setGroup, setActiveGroup, setActiveUser, setEditOn, setAddUserOn, setDeleteOn, refreshFlagGroups, refreshVersion }: Props) {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<GroupCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    if (!user) { setGroups([]); setLoading(false); return; }
    setLoading(true); setError('');
    getGroups(user).then(data => {
      if (!active) return;
      if (!data) setError('Could not load groups. Please refresh the page.');
      setGroups(data ?? []);
    }).catch(() => { if (active) setError('Could not load groups. Please refresh the page.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, refreshVersion]);
  const resetMode = () => { setAddUserOn(false); setEditOn(false); setDeleteOn(false); };
  const action = DeleteOn ? 'Delete group' : EditOn ? 'Edit group' : AddUserOn ? Mode === 'Delete' ? 'Remove members' : 'Add members' : 'Open group';
  const filtered = groups.filter(group => (group.Name ?? group.name ?? '').toLowerCase().includes(search.toLowerCase()));
  const selectGroup = async (group: GroupCard) => {
    if (DeleteOn) {
      setDeleting(group.id);
      try { await deleteGroup(group.id); refreshFlagGroups(); }
      catch { setError('Could not delete this group. Please try again.'); }
      finally { setDeleting(null); }
    } else if (EditOn || AddUserOn) {
      setGroup(group);
      if (EditOn) setActiveGroup(true); else setActiveUser(true);
    } else router.push('/pages/Task/' + group.id);
  };
  return <section className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-blue-950">Your groups <span className="ml-2 rounded-full bg-blue-100 px-2.5 py-1 text-xs text-blue-600">{groups.length}</span></h2><p className="mt-1 text-sm text-slate-500">Open a group to view tasks and work together.</p></div>
        <label className="flex w-full items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-slate-400 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 sm:w-64"><FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" /><input type="search" aria-label="Search groups" placeholder="Search groups..." value={search} onChange={event => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-blue-950 outline-none placeholder:text-slate-400" /></label>
      </div>
      {(DeleteOn || AddUserOn || EditOn) && <div className={'mb-5 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ' + (DeleteOn ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-700')}><span><strong>{action}</strong> · Select a group below.</span><button type="button" onClick={resetMode} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 font-semibold hover:bg-white"><FontAwesomeIcon icon={faXmark} />Cancel</button></div>}
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</p>}
      {loading || authLoading ? <div role="status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><span className="sr-only">Loading groups...</span>{[0, 1, 2].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl border border-blue-100 bg-blue-50" />)}</div> : !user ? <p className="rounded-xl bg-white p-6 text-sm text-slate-500">Sign in to view your groups.</p> : !filtered.length ? <div className="flex flex-col items-center rounded-2xl border border-dashed border-blue-200 bg-white px-6 py-12 text-center"><span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-400"><FontAwesomeIcon icon={faUsers} /></span><h3 className="font-semibold text-blue-950">{search ? 'No matching groups' : 'Create your first group'}</h3><p className="mt-2 max-w-sm text-sm text-slate-500">{search ? 'Try a different group name.' : 'Use Create group to bring your team and shared tasks together.'}</p></div> : <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(group => {
        const name = group.Name ?? group.name ?? 'Untitled group';
        const members = group.Users_Groups?.length ?? 0;
        const owner = user.id === (group.ownerId ?? group.owner_id ?? group.Admin);
        return <li key={group.id}><button type="button" disabled={deleting !== null} onClick={() => void selectGroup(group)} aria-label={action + ': ' + name} className={'group flex h-full min-h-48 w-full flex-col rounded-2xl border bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ' + (DeleteOn ? 'border-red-100 hover:border-red-300' : 'border-blue-100 hover:border-blue-300')}>
          <span className="mb-4 flex w-full items-start justify-between gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">{group.image_path ? <Image src={'/img/' + group.image_path + '.png'} alt="" width={30} height={30} className="object-contain" /> : <FontAwesomeIcon icon={faUsers} className="text-xl text-blue-400" />}</span>{owner && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">Owner</span>}</span>
          <span className="mb-2 break-words text-base font-semibold text-blue-950">{name}</span><span className="flex items-center gap-2 text-xs text-slate-500"><FontAwesomeIcon icon={faUsers} className="text-blue-300" />{members} {members === 1 ? 'member' : 'members'}</span>
          <span className={'mt-5 flex w-full items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold ' + (DeleteOn ? 'text-red-500' : 'text-blue-500')}>{deleting === group.id ? 'Deleting...' : action}<FontAwesomeIcon icon={faArrowRight} className="transition-transform group-hover:translate-x-1" /></span>
        </button></li>;
      })}</ul>}
    </div>
  </section>;
}
