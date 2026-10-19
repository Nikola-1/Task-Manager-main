'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

export const priorityOptions = [
  { value: 'high', label: 'High', color: 'text-red-600' },
  { value: 'medium', label: 'Medium', color: 'text-amber-600' },
  { value: 'low', label: 'Low', color: 'text-blue-600' },
  { value: 'none', label: 'No priority', color: 'text-slate-500' },
] as const;
export type TaskPriority = typeof priorityOptions[number]['value'];
const changedEvent = 'help-task:priority-changed';
const noPriority = () => 'none' as const;

export function saveTaskPriority(userId: number, taskId: number, value: TaskPriority) {
  if (!priorityOptions.some(option => option.value === value)) throw new Error('Invalid priority.');
  const key = `help-task:priority:${userId}:${taskId}`;
  if (value === 'none') localStorage.removeItem(key);
  else localStorage.setItem(key, value);
  window.dispatchEvent(new Event(changedEvent));
}

function subscribe(listener: () => void) {
  window.addEventListener('storage', listener);
  window.addEventListener(changedEvent, listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener(changedEvent, listener);
  };
}

export default function useTaskPriority(userId: number | undefined, taskId: number) {
  const key = `help-task:priority:${userId}:${taskId}`;
  const read = useCallback((): TaskPriority => {
    if (userId == null) return 'none';
    try {
      const value = localStorage.getItem(key);
      return priorityOptions.find(option => option.value === value)?.value ?? 'none';
    } catch { return 'none'; }
  }, [key, userId]);
  const priority = useSyncExternalStore(subscribe, read, noPriority);
  const setPriority = (value: TaskPriority) => {
    if (userId == null) throw new Error('Sign in to set a priority.');
    saveTaskPriority(userId, taskId, value);
  };
  return { priority, setPriority };
}

export function useTaskPriorities(userId: number | undefined, tasks: { id: number }[]) {
  const read = useCallback(() => JSON.stringify(tasks.map(task => {
    if (userId == null) return [task.id, 'none'];
    try {
      const value = localStorage.getItem(`help-task:priority:${userId}:${task.id}`);
      return [task.id, priorityOptions.find(option => option.value === value)?.value ?? 'none'];
    } catch { return [task.id, 'none']; }
  })), [userId, tasks]);
  const snapshot = useSyncExternalStore(subscribe, read, () => '[]');
  return useMemo(() => Object.fromEntries(JSON.parse(snapshot)) as Record<number, TaskPriority>, [snapshot]);
}
