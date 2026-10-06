'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import type { TaskType } from '@/types/TaskType';
import { saveContent } from '@/features/tasks/data/tasks.repository';
import EditorDropdown from '@/features/tasks/components/TaskDisplay/EditorDropdown';

interface TaskEditorProps {
  editor: Editor;
  task: TaskType;
  refreshTasks: () => Promise<void>;
}
const fonts = ['Montserrat', 'Roboto', 'Bebas Neue', 'Fascinate', 'Google Sans Code', 'Comic Sans MS'];

export default function TaskEditor({ editor, task, refreshTasks }: TaskEditorProps) {
  const [savedHtml, setSavedHtml] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savingRef = useRef(false);
  const mounted = useRef(true);
  const contentRef = useRef<HTMLDivElement>(null);
  // The parent keys this panel by task ID: load once, preserve the draft on refresh.
  useEffect(() => {
    mounted.current = true;
    editor.commands.setContent(task.content ?? '');
    setSavedHtml(editor.getHTML());
    return () => { mounted.current = false; };
  }, [editor, task.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const surface = contentRef.current;
    if (!surface) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animation: Animation | null = null;
    const animateTyping = (event: Event) => {
      const input = event as InputEvent;
      if (reducedMotion.matches || input.isComposing ||
        !input.inputType?.startsWith('insert') || input.inputType === 'insertFromPaste' ||
        animation?.playState === 'running') return;

      const node = window.getSelection()?.focusNode;
      if (!node) return;
      const element = node instanceof Element ? node : node.parentElement;
      const block = element?.closest('p, h1, h2, h3, h4, h5, h6, pre');
      if (!block || !surface.contains(block)) return;
      // Animate the painted block without changing the document or cursor position.
      animation = block.animate([{ opacity: 0.88 }, { opacity: 1 }], {
        duration: 140,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      });
    };
    const stopAnimation = () => { if (reducedMotion.matches) animation?.cancel(); };
    surface.addEventListener('input', animateTyping);
    reducedMotion.addEventListener('change', stopAnimation);
    return () => {
      surface.removeEventListener('input', animateTyping);
      reducedMotion.removeEventListener('change', stopAnimation);
      animation?.cancel();
    };
  }, [editor]);

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      html: current.getHTML(),
      words: current.getText().trim().split(/\s+/).filter(Boolean).length,
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      bulletList: current.isActive('bulletList'),
      orderedList: current.isActive('orderedList'),
      heading: [1, 2, 3].find(level => current.isActive('heading', { level })) ?? 0,
      font: current.getAttributes('textStyle').fontFamily ?? '',
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
    }),
  });
  const dirty = savedHtml !== null && state.html !== savedHtml;
  const save = async () => {
    if (!dirty || savingRef.current) return;
    const html = editor.getHTML();
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      const updated = await saveContent(task.id, html);
      if (!updated) throw new Error('Save failed');
      if (mounted.current) setSavedHtml(html);
      await refreshTasks();
    } catch {
      if (mounted.current) setError('Could not save changes. Please try again.');
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(false);
    }
  };
  const controls = [
    { label: 'Bold', text: 'B', active: state.bold, action: () => editor.chain().focus().toggleBold().run() },
    { label: 'Italic', text: 'I', active: state.italic, action: () => editor.chain().focus().toggleItalic().run() },
    { label: 'Bullet list', text: '• List', active: state.bulletList, action: () => editor.chain().focus().toggleBulletList().run() },
    { label: 'Numbered list', text: '1. List', active: state.orderedList, action: () => editor.chain().focus().toggleOrderedList().run() },
  ];
  return <section className="task-editor flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white"
    aria-label={`Notes for ${task.name}`} onKeyDown={event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); void save(); }
    }}>
    <header className="shrink-0 border-b border-blue-200 bg-blue-300 px-5 py-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-blue-800">Task notes</p>
      <h2 className="break-words text-lg font-semibold text-blue-900">{task.name}</h2>
    </header>
    <div role="group" aria-label="Text formatting" className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-blue-200 bg-blue-50 px-3 py-2.5">
      <EditorDropdown label="Text style" icon="T" value={String(state.heading)} options={[
        { value: '0', label: 'Normal text' },
        { value: '1', label: 'Heading 1', style: { fontSize: '20px', fontWeight: 700 } },
        { value: '2', label: 'Heading 2', style: { fontSize: '17px', fontWeight: 600 } },
        { value: '3', label: 'Heading 3', style: { fontSize: '14px', fontWeight: 600 } },
      ]} onChange={value => {
        const level = Number(value);
        if (level === 0) editor.chain().focus().setParagraph().run();
        else editor.chain().focus().setHeading({ level: level as 1 | 2 | 3 }).run();
      }} />
      <EditorDropdown label="Font family" icon="Aa" value={state.font} options={[
        { value: '', label: 'Default font' },
        ...fonts.map(font => ({ value: font, label: font, style: { fontFamily: font } })),
      ]} onChange={value => {
        if (value) editor.chain().focus().setFontFamily(value).run();
        else editor.chain().focus().unsetFontFamily().run();
      }} />
      {controls.map(control => <button type="button" key={control.label} aria-label={control.label} title={control.label}
        aria-pressed={control.active} className={`editor-tool ${control.active ? 'is-active' : ''}`}
        onMouseDown={event => event.preventDefault()} onClick={control.action}>{control.text}</button>)}
      <button type="button" className="editor-tool" title="Clear formatting" onMouseDown={event => event.preventDefault()}
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>Clear</button>
      <div className="ml-auto flex gap-1">
        <button type="button" aria-label="Undo" title="Undo" disabled={!state.canUndo} className="editor-tool" onMouseDown={event => event.preventDefault()} onClick={() => editor.chain().focus().undo().run()}>↶</button>
        <button type="button" aria-label="Redo" title="Redo" disabled={!state.canRedo} className="editor-tool" onMouseDown={event => event.preventDefault()} onClick={() => editor.chain().focus().redo().run()}>↷</button>
      </div>
    </div>
    <div ref={contentRef} className="task-editor-content min-h-0 flex-1 overflow-y-auto">
      <EditorContent editor={editor} />
    </div>
    <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-blue-200 bg-blue-50 px-4 py-3">
      <div className="text-xs text-blue-900">
        <p role="status" className={error ? 'text-red-600' : ''}>{error || (savedHtml === null ? 'Loading notes…' : saving ? 'Saving…' : dirty ? 'Unsaved changes' : 'All changes saved')}</p>
        <p className="mt-1">{state.words} {state.words === 1 ? 'word' : 'words'} · Ctrl / ⌘ + S to save</p>
      </div>
      <button type="button" disabled={!dirty || saving} onClick={() => void save()}
        className="rounded-md border border-blue-300 bg-blue-300 px-4 py-2 text-sm font-semibold text-blue-900 transition hover:bg-blue-400 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-40">
        {saving ? 'Saving…' : 'Save notes'}
      </button>
    </footer>
  </section>;
}
