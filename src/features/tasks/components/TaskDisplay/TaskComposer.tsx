'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faCalendar, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { createTaskWithOptions, getTaskCreationChoices, type TaskChoice } from '@/features/tasks/data/create-task.repository';
import { priorityOptions, saveTaskPriority, type TaskPriority } from '@/features/tasks/hooks/useTaskPriority';
import { TASK_NAME_MAX_LENGTH, validateTaskDraft } from '@/features/tasks/data/task-validation';

interface Props {
  userId?: number; groupId: number | null; date: Date | null;
  categoryId?: number; tagId?: number; onChooseDate: () => void; refreshTasks: () => Promise<void>;
}

export default function TaskComposer({ userId, groupId, date, categoryId, tagId, onChooseDate, refreshTasks }: Props) {
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const [priority, setPriority] = useState<TaskPriority>('none');
  const [category, setCategory] = useState<number | null | undefined>();
  const [selectedTags, setSelectedTags] = useState<number[] | undefined>();
  const [file, setFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<TaskChoice[]>([]);
  const [tags, setTags] = useState<TaskChoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const dateButton = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLFormElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const panelId = useId();
  const validationId = useId();
  const activeCategory = category === undefined ? categoryId || null : category;
  const activeTags = selectedTags ?? (tagId ? [tagId] : []);
  const draft = { name, date, userId, groupId, categoryId: activeCategory, tagIds: activeTags, file, priority };
  const draftErrors = validateTaskDraft(draft);
  const validationErrors = submitted ? draftErrors : draftErrors.file ? { file: draftErrors.file } : {};
  useEffect(() => {
    if (!open || userId == null) return;
    let active = true;
    setLoading(true); setLoadError('');
    getTaskCreationChoices(userId, groupId).then(data => {
      if (active) { setCategories(data.categories); setTags(data.tags); }
    }).catch(() => { if (active) setLoadError('Could not load categories and tags.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, userId, groupId, attempt]);
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLSelectElement>('select')?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const submit = async () => {
    if (busy.current) return;
    setSubmitted(true); setError('');
    const errors = validateTaskDraft(draft);
    if (Object.keys(errors).length) {
      if (errors.name) nameInput.current?.focus();
      else if (errors.date) dateButton.current?.focus();
      else if (errors.file || errors.category || errors.tags || errors.priority) setOpen(true);
      return;
    }
    if (userId == null || !date) return;
    busy.current = true; setSaving(true); setError('');
    let created = false;
    try {
      const id = await createTaskWithOptions({ name, date, userId, groupId, categoryId: activeCategory, tagIds: activeTags, file, priority });
      created = true;
      if (priority !== 'none') {
        try { saveTaskPriority(userId, id, priority); }
        catch { setError('Task added, but its priority could not be saved on this device.'); }
      }
      setName(''); setPriority('none'); setCategory(undefined); setSelectedTags(undefined); setFile(null); setOpen(false);
      setSubmitted(false);
      if (fileInput.current) fileInput.current.value = '';
      await refreshTasks();
    } catch (cause) {
      setError(created ? 'Task added. Refresh the list to see it.' : cause instanceof Error ? cause.message : 'Could not add task. Please try again.');
    } finally { busy.current = false; setSaving(false); }
  };
  const fieldClass = 'task-options-field mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm font-normal text-blue-900 disabled:opacity-50';
  const hasOptions = priority !== 'none' || activeCategory !== null || activeTags.length > 0 || file !== null;
  return <form ref={root} noValidate className="relative mx-3 mb-3 mt-3" onSubmit={event => { event.preventDefault(); void submit(); }}
    onKeyDown={event => {
      if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
    }}>
    <div className="task-name-entry flex min-w-0 items-center gap-2 rounded-md bg-blue-300 p-2 text-white">
      <button type="submit" aria-label="Add task" disabled={saving || userId == null} className="shrink-0 rounded p-1 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><FontAwesomeIcon className="task-name-entry-icon" icon={faPlus} /></button>
      <input ref={nameInput} required maxLength={TASK_NAME_MAX_LENGTH} aria-label="New task name" aria-invalid={!!validationErrors.name} aria-describedby={validationErrors.name ? validationId : undefined} value={name} disabled={saving} onChange={event => { setName(event.target.value); setError(''); }} onKeyDown={event => { if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault(); }} placeholder="Add task" className="min-w-0 flex-1 bg-transparent outline-none placeholder-white/80" />
      <button ref={dateButton} type="button" aria-label="Choose task date" aria-describedby={validationErrors.date ? validationId : undefined} disabled={saving} onClick={onChooseDate} className={`flex shrink-0 items-center gap-1 rounded px-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${validationErrors.date ? 'ring-2 ring-red-500' : ''}`}><span>{date && Number.isFinite(date.getTime()) ? date.toLocaleDateString('sr-RS') : 'Choose date'}</span><FontAwesomeIcon icon={faCalendar} /></button>
      <button ref={trigger} type="button" aria-label="Task options" aria-expanded={open} aria-controls={open ? panelId : undefined} disabled={saving || userId == null} onClick={() => setOpen(value => !value)} className="shrink-0 rounded p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><FontAwesomeIcon icon={faArrowDown} className={`transition-transform ${open ? 'rotate-180' : ''}`} /></button>
    </div>
    {hasOptions && <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] text-[#40537f]" aria-label="Selected task options">
      {priority !== 'none' && <span className="px-2 py-1">{priorityOptions.find(option => option.value === priority)?.label} priority</span>}
      {activeCategory !== null && <span className="px-2 py-1">{categories.find(item => item.id === activeCategory)?.name ?? 'Selected category'}</span>}
      {activeTags.length > 0 && <span className="px-2 py-1">{activeTags.length} {activeTags.length === 1 ? 'tag' : 'tags'}</span>}
      {file && <span className="max-w-full truncate px-2 py-1">{file.name}</span>}
    </div>}
    {Object.keys(validationErrors).length > 0 && <ul id={validationId} role="alert" className="mt-2 space-y-1 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{Object.entries(validationErrors).map(([field, message]) => <li key={field}>{message}</li>)}</ul>}
    {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    {saving && <p role="status" className="mt-1 text-xs text-blue-600">Adding task...</p>}
    {open && <div ref={panel} id={panelId} role="region" aria-label="New task options" className="task-options-panel absolute right-0 top-full z-40 mt-3 max-h-[65dvh] w-full max-w-sm space-y-5 overflow-y-auto rounded-2xl border border-blue-200 bg-white p-5 text-blue-900 shadow-xl">
      <div className="task-options-header flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold">Task options</h3><p className="mt-1 text-xs">Organize your task before adding it.</p></div><button type="button" aria-label="Close task options" onClick={() => { setOpen(false); trigger.current?.focus(); }} className="task-options-close flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"><FontAwesomeIcon icon={faXmark} /></button></div>
      <label className="block text-xs font-semibold">Priority<select value={priority} disabled={saving} onChange={event => setPriority(event.target.value as TaskPriority)} className={fieldClass}>{priorityOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      <label className="block text-xs font-semibold">Category<select value={activeCategory ?? ''} disabled={saving || loading || !!loadError} onChange={event => setCategory(event.target.value ? Number(event.target.value) : null)} className={fieldClass}><option value="">No category</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <fieldset disabled={saving || loading || !!loadError}><legend className="mb-2 text-xs font-semibold">Tags</legend><div className="max-h-32 space-y-1 overflow-y-auto">{tags.map(item => <label key={item.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-blue-50"><input type="checkbox" checked={activeTags.includes(item.id)} onChange={event => setSelectedTags(event.target.checked ? [...activeTags, item.id] : activeTags.filter(id => id !== item.id))} className="accent-blue-500" /><span className="break-words">{item.name}</span></label>)}{!loading && !loadError && !tags.length && <p className="text-xs text-blue-500">No tags available.</p>}</div></fieldset>
      {loading && <p role="status" className="text-xs text-blue-500">Loading categories and tags...</p>}
      {loadError && <p role="alert" className="text-xs text-red-700">{loadError}<button type="button" onClick={() => setAttempt(value => value + 1)} className="ml-2 underline">Retry</button></p>}
      <label className="block text-xs font-semibold">Attachment <span className="font-normal text-blue-500">(up to 25 MB)</span><input ref={fileInput} type="file" aria-invalid={!!validationErrors.file} aria-describedby={validationErrors.file ? validationId : undefined} disabled={saving} onChange={event => { setFile(event.target.files?.[0] ?? null); setError(''); }} className="mt-2 block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-blue-100 file:px-2 file:py-1.5 file:text-blue-800" /></label>
      {file && <div className="flex items-center gap-2 text-xs"><span className="min-w-0 flex-1 break-words">{file.name}</span><button type="button" disabled={saving} onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ''; }} className="shrink-0 underline">Remove</button></div>}
      <div className="task-options-footer"><button type="button" onClick={() => { setOpen(false); trigger.current?.focus(); }} className="task-options-done w-full rounded-lg px-3 py-2.5 text-sm font-semibold">Done</button></div>
    </div>}
  </form>;
}
