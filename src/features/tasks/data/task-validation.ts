export const TASK_NAME_MAX_LENGTH = 200;
export const TASK_FILE_MAX_BYTES = 25 * 1024 * 1024;

export interface TaskDraft {
  name: string;
  date: Date | null;
  userId: number | undefined;
  groupId: number | null;
  categoryId: number | null;
  tagIds: number[];
  file: Pick<File, 'name' | 'size'> | null;
  priority?: string;
}
export type TaskValidationErrors = Partial<Record<'name' | 'date' | 'user' | 'group' | 'category' | 'tags' | 'file' | 'priority', string>>;

const validId = (id: number | undefined) => Number.isSafeInteger(id) && Number(id) > 0;

export function validateTaskDraft(draft: TaskDraft): TaskValidationErrors {
  const errors: TaskValidationErrors = {};
  const name = draft.name.trim();
  if (!name || /^[\s\u200B-\u200D\u2060\uFEFF]*$/u.test(name)) errors.name = 'Enter a task name.';
  else if (name.length > TASK_NAME_MAX_LENGTH) errors.name = `Task name must be ${TASK_NAME_MAX_LENGTH} characters or fewer.`;
  else if ([...name].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) errors.name = 'Task name must be a single line without control characters.';
  if (!draft.date || !Number.isFinite(draft.date.getTime())) errors.date = 'Choose a valid date for this task.';
  if (!validId(draft.userId)) errors.user = 'Sign in before adding a task.';
  if (draft.groupId !== null && !validId(draft.groupId)) errors.group = 'Choose a valid group.';
  if (draft.categoryId !== null && !validId(draft.categoryId)) errors.category = 'Choose a valid category or select No category.';
  if (draft.tagIds.some(id => !validId(id))) errors.tags = 'Choose valid tags.';
  if (draft.priority !== undefined && !['high', 'medium', 'low', 'none'].includes(draft.priority)) errors.priority = 'Choose a valid priority.';
  if (draft.file) {
    if (!draft.file.name.trim() || !Number.isFinite(draft.file.size) || draft.file.size <= 0) errors.file = 'Choose a non-empty file.';
    else if (draft.file.size > TASK_FILE_MAX_BYTES) errors.file = 'Attachment must be 25 MB or smaller.';
  }
  return errors;
}
