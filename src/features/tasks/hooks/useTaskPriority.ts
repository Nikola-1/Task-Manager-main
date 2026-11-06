'use client';

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { userData } from '@/lib/user-data-client';

export const priorityOptions = [
  { value: 'high', label: 'High', color: 'text-red-600' },
  { value: 'medium', label: 'Medium', color: 'text-amber-600' },
  { value: 'low', label: 'Low', color: 'text-blue-600' },
  { value: 'none', label: 'No priority', color: 'text-slate-500' },
] as const;
export type TaskPriority = typeof priorityOptions[number]['value'];
const cache = new Map<number, Record<number, TaskPriority>>();
const errors = new Map<number, string>();
const pending = new Map<number, Promise<void>>();
const revisions = new Map<number, number>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());
const emptySnapshot = () => '{}';
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }

async function loadPriorities(userId: number) {
  if (pending.has(userId)) return pending.get(userId);
  const revision = revisions.get(userId) ?? 0;
  const request = userData<{ task_id: number; priority: TaskPriority }[]>('resource=priorities').then(rows => {
    if ((revisions.get(userId) ?? 0) !== revision) return;
    cache.set(userId, Object.fromEntries(rows.map(row => [row.task_id, row.priority])));
    errors.delete(userId);
  }).catch(error => { errors.set(userId, error instanceof Error ? error.message : 'Could not load priorities.'); })
    .finally(() => {
      pending.delete(userId); emit();
      if ((revisions.get(userId) ?? 0) !== revision) void loadPriorities(userId);
    });
  pending.set(userId, request);
  return request;
}

export async function saveTaskPriority(userId: number, taskId: number, value: TaskPriority) {
  if (!priorityOptions.some(option => option.value === value)) throw new Error('Invalid priority.');
  await userData('resource=priorities', { method: 'POST', body: { taskId, priority: value } });
  revisions.set(userId, (revisions.get(userId) ?? 0) + 1);
  cache.set(userId, { ...cache.get(userId), [taskId]: value });
  errors.delete(userId);
  emit();
}

function usePriorityData(userId: number | undefined, taskKey: string) {
  const read = useCallback(() => JSON.stringify({ values: userId == null ? {} : cache.get(userId) ?? {}, error: userId == null ? '' : errors.get(userId) ?? '' }), [userId]);
  const snapshot = useSyncExternalStore(subscribe, read, emptySnapshot);
  useEffect(() => {
    if (userId == null) return;
    const refresh = () => { void loadPriorities(userId); };
    refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [userId, taskKey]);
  return useMemo(() => JSON.parse(snapshot) as { values?: Record<number, TaskPriority>; error?: string }, [snapshot]);
}

export default function useTaskPriority(userId: number | undefined, taskId: number) {
  const { values, error } = usePriorityData(userId, String(taskId));
  const setPriority = async (value: TaskPriority) => {
    if (userId == null) throw new Error('Sign in to set a priority.');
    await saveTaskPriority(userId, taskId, value);
  };
  return { priority: values?.[taskId] ?? 'none', setPriority, error };
}

export function useTaskPriorities(userId: number | undefined, tasks: { id: number }[]) {
  return usePriorityData(userId, tasks.map(task => task.id).join(',')).values ?? {};
}
