import type { TaskType } from '@/types/TaskType';
import type { TaskPriority } from '@/features/tasks/hooks/useTaskPriority';

export type TaskDateSort = 'default' | 'date-asc' | 'date-desc';
export type TaskSort = TaskDateSort | 'priority-desc' | 'priority-asc';

export function sortTasks(tasks: TaskType[], order: TaskSort, priorities: Record<number, TaskPriority> = {}): TaskType[] {
  if (order !== 'priority-desc' && order !== 'priority-asc') return sortTasksByDate(tasks, order);
  const ranks = { high: 3, medium: 2, low: 1, none: 0 };
  return [...tasks].sort((a, b) => {
    const first = ranks[priorities[a.id] ?? 'none'];
    const second = ranks[priorities[b.id] ?? 'none'];
    // Unprioritized tasks stay at the end in either direction.
    if (!first) return second ? 1 : 0;
    if (!second) return -1;
    return order === 'priority-desc' ? second - first : first - second;
  });
}

export function sortTasksByDate(tasks: TaskType[], order: TaskDateSort): TaskType[] {
  if (order === 'default') return tasks;
  const timestamp = (date: string | null) => {
    if (!date) return null;
    const value = Date.parse(date);
    return Number.isFinite(value) ? value : null;
  };
  return [...tasks].sort((a, b) => {
    const first = timestamp(a.date), second = timestamp(b.date);
    if (first === null) return second === null ? 0 : 1;
    if (second === null) return -1;
    return order === 'date-asc' ? first - second : second - first;
  });
}
