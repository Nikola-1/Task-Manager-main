'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getTaskRecipients, sendTaskToMember, type TaskRecipient } from '@/features/tasks/data/task-sharing.repository';

interface Props { taskId: number; taskName: string; groupId: number; senderId: number; close: () => void }

export default function SendTaskDialog({ taskId, taskName, groupId, senderId, close }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const busy = useRef(false);
  const [members, setMembers] = useState<TaskRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipient, setRecipient] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    dialog.current?.showModal();
    const element = dialog.current;
    return () => element?.close();
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setRecipient(null);
    getTaskRecipients(taskId, groupId, senderId).then(data => { if (active) setMembers(data); })
      .catch(() => { if (active) setError('Could not load group members. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [taskId, groupId, senderId, attempt]);
  const send = async () => {
    if (recipient === null || busy.current) return;
    busy.current = true; setSending(true); setError('');
    try {
      const sent = await sendTaskToMember(taskId, groupId, senderId, recipient);
      setSuccess(sent ? 'Task sent successfully.' : 'This member already has this task.');
      setMembers(current => current.map(member => member.id === recipient ? { ...member, assigned: true } : member));
      setRecipient(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send task. Please try again.');
    } finally { busy.current = false; setSending(false); }
  };
  return createPortal(<dialog ref={dialog} aria-labelledby={`send-task-${taskId}`} onCancel={event => { event.preventDefault(); if (!busy.current) close(); }}
    onClick={event => { if (event.target === event.currentTarget && !busy.current) close(); }}
    className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-2xl border border-blue-200 bg-white p-0 text-blue-900 shadow-xl backdrop:bg-blue-950/35">
    <div className="border-b border-blue-200 bg-blue-100 px-5 py-4">
      <h2 id={`send-task-${taskId}`} className="text-lg font-bold">Send to colleague</h2>
      <p className="mt-1 break-words text-sm">{taskName}</p>
    </div>
    <div className="p-5">
      <p className="mb-4 text-xs text-blue-700">Choose a member of this group. You will both share the same task, notes and completion status.</p>
      {loading ? <p role="status" className="text-sm">Loading members...</p> : <div className="max-h-64 space-y-2 overflow-y-auto">
        {!members.length && !error && <p className="text-sm">There are no other members in this group.</p>}
        {members.map(member => <label key={member.id} className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${member.assigned ? 'border-blue-100 bg-blue-50 opacity-60' : recipient === member.id ? 'border-blue-400 bg-blue-100' : 'cursor-pointer border-blue-200 hover:bg-blue-50'}`}>
          <input type="radio" name={`recipient-${taskId}`} checked={recipient === member.id} disabled={member.assigned || sending || !!success} onChange={() => setRecipient(member.id)} className="shrink-0 accent-blue-600" />
          <span className="min-w-0 flex-1 break-words">{member.name}</span>{member.assigned && <span className="text-xs">Already assigned</span>}
        </label>)}
      </div>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}{!members.length && <button type="button" onClick={() => setAttempt(value => value + 1)} className="ml-2 underline">Retry</button>}</p>}
      {success && <p role="status" className="mt-3 text-sm font-semibold text-green-700">{success}</p>}
    </div>
    <div className="flex justify-end gap-2 border-t border-blue-100 bg-blue-50 px-5 py-3">
      <button type="button" disabled={sending} onClick={close} className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">{success ? 'Done' : 'Cancel'}</button>
      {!success && <button type="button" disabled={loading || sending || recipient === null} onClick={() => void send()} className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-40">{sending ? 'Sending...' : 'Send task'}</button>}
    </div>
  </dialog>, document.body);
}
