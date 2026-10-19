'use client';
import type { Dispatch, SetStateAction } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faPlus, faUserPlus, faUserMinus, faTrashCan } from '@fortawesome/free-solid-svg-icons';
interface Props {
  setActiveGroup: Dispatch<SetStateAction<boolean>>;
  setEditOn: Dispatch<SetStateAction<boolean>>;
  DeleteOn: boolean;
  setDeleteOn: Dispatch<SetStateAction<boolean>>;
  setMode: Dispatch<SetStateAction<string | undefined>>;
  Mode: string | undefined;
  AddUserOn: boolean;
  setAddUserOn: Dispatch<SetStateAction<boolean>>;
}
export default function OptionsGroupsComponent({ setActiveGroup, setEditOn, DeleteOn, setDeleteOn, setMode, Mode, AddUserOn, setAddUserOn }: Props) {
  const reset = () => { setAddUserOn(false); setEditOn(false); setDeleteOn(false); };
  return <header className="shrink-0 border-b border-blue-200 bg-blue-300 px-4 py-5 sm:px-6 lg:px-8">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5">
      <div><h1 className="flex items-center gap-3 text-xl font-bold text-blue-950"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/60"><FontAwesomeIcon icon={faUsers} /></span>Groups</h1><p className="mt-2 text-xs text-blue-800">A shared space for your team and tasks.</p></div>
      <button type="button" onClick={() => { reset(); setMode('Insert'); setActiveGroup(true); }} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-blue-700"><FontAwesomeIcon icon={faPlus} />Create group</button>
    </div>
    <nav aria-label="Group actions" className="mx-auto mt-5 flex max-w-6xl flex-wrap gap-2">
      {[{ label: 'Add members', icon: faUserPlus, mode: 'Insert', active: AddUserOn && Mode === 'Insert' }, { label: 'Remove members', icon: faUserMinus, mode: 'Delete', active: AddUserOn && Mode === 'Delete' }].map(action => <button type="button" key={action.label} aria-pressed={action.active} onClick={() => { reset(); setAddUserOn(!action.active); setMode(action.mode); }} className={'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition focus-visible:outline-blue-700 ' + (action.active ? 'border-blue-600 bg-blue-600 text-white' : 'border-white/60 bg-white/60 text-blue-900 hover:bg-white')}><FontAwesomeIcon icon={action.icon} />{action.label}</button>)}
      <button type="button" aria-pressed={DeleteOn} onClick={() => { reset(); setDeleteOn(!DeleteOn); setMode('Delete'); }} className={'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition focus-visible:outline-red-600 ' + (DeleteOn ? 'border-red-500 bg-red-500 text-white' : 'border-white/60 bg-white/60 text-blue-900 hover:bg-red-50 hover:text-red-600')}><FontAwesomeIcon icon={faTrashCan} />Delete group</button>
    </nav>
  </header>;
}
