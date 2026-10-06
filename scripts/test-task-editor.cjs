const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync('src/features/tasks/components/TaskDisplay/TaskEditor.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }
}).outputText;

function harness(browser = false) {
  let cursor = 0, html = '', effects = [], initialized = false, pendingSave;
  const slots = [], calls = [];
  const editor = {
    commands: { setContent(value) { html = value || '<p></p>'; } },
    getHTML: () => html, getText: () => html.replace(/<[^>]*>/g, ''),
    isActive: () => false, getAttributes: () => ({}), can: () => ({ undo: () => false, redo: () => false })
  };
  Object.defineProperty(editor, 'view', { get() { throw new Error('Editor view is not mounted'); } });
  const listeners = {};
  let animations = 0;
  const motion = { matches: false, addEventListener() {}, removeEventListener() {} };
  class TestElement {
    closest() { return this; }
    animate() { animations++; return { playState: 'finished', cancel() {} }; }
  }
  const block = new TestElement();
  const surface = {
    contains: node => node === block,
    addEventListener(name, handler) { listeners[name] = handler; },
    removeEventListener(name) { delete listeners[name]; }
  };
  const react = {
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = value; }]; },
    useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
    useEffect(effect) { if (!initialized) effects.push(effect); }
  };
  const jsx = (type, props) => ({ type, props });
  const modules = {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '@tiptap/react': { EditorContent: 'editor', useEditorState: ({ selector }) => selector({ editor }) },
    '@/features/tasks/components/TaskDisplay/EditorDropdown': { default: 'editor-dropdown' },
    '@/features/tasks/data/tasks.repository': { saveContent(id, value) {
      calls.push([id, value]);
      return new Promise(resolve => { pendingSave = resolve; });
    } }
  };
  const context = { exports: {}, require: name => modules[name] };
  if (browser) {
    context.Element = TestElement;
    context.window = { matchMedia: () => motion, getSelection: () => ({ focusNode: block }) };
  }
  vm.runInNewContext(compiled, context);
  let refreshes = 0;
  const props = { editor, task: { id: 42, name: 'Task', content: '<p>Original</p>' }, refreshTasks: async () => { refreshes++; } };
  function render() {
    cursor = 0;
    const tree = context.exports.default(props);
    if (browser) nodes(tree).filter(node => node.props?.ref).forEach(node => { node.props.ref.current = surface; });
    effects.splice(0).forEach(effect => effect());
    initialized = true;
    return tree;
  }
  function nodes(tree) {
    if (!tree || typeof tree !== 'object') return [];
    const children = tree.props?.children;
    return [tree, ...(Array.isArray(children) ? children.flatMap(nodes) : nodes(children))];
  }
  const button = tree => nodes(tree).find(node => node.type === 'button' && ['Save notes', 'Saving…'].includes(node.props.children));
  const status = tree => nodes(tree).find(node => node.props?.role === 'status').props.children;
  return { render, button, status, calls, props, motion, input(event) { listeners.input(event); }, get animations() { return animations; }, edit(value) { html = value; }, resolve(value) { pendingSave(value); }, get refreshes() { return refreshes; } };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  const browser = harness(true);
  browser.render();
  browser.input({ inputType: 'insertText', isComposing: false });
  assert.equal(browser.animations, 1, 'Typing animates without accessing the unmounted editor view');
  browser.input({ inputType: 'insertText', isComposing: true });
  browser.input({ inputType: 'insertFromPaste', isComposing: false });
  browser.motion.matches = true;
  browser.input({ inputType: 'insertText', isComposing: false });
  assert.equal(browser.animations, 1, 'Skip composition, paste and reduced motion');
  const h = harness();
  h.render();
  assert.equal(h.button(h.render()).props.disabled, true);
  h.edit('<p>Draft</p>');
  let tree = h.render();
  assert.equal(h.status(tree), 'Unsaved changes');
  h.button(tree).props.onClick();
  h.button(tree).props.onClick();
  assert.equal(h.calls.length, 1, 'Prevent concurrent saves');
  assert.equal(h.calls[0][0], 42);
  assert.equal(h.calls[0][1], '<p>Draft</p>');
  h.edit('<p>Typed while saving</p>');
  h.resolve({ id: 42 });
  await flush();
  assert.equal(h.status(h.render()), 'Unsaved changes', 'New typing stays unsaved');
  assert.equal(h.refreshes, 1);
  h.props.task = { ...h.props.task, content: '<p>Server refresh</p>' };
  assert.equal(h.status(h.render()), 'Unsaved changes', 'Refresh does not replace draft');
  tree = h.render();
  let prevented = false;
  tree.props.onKeyDown({ ctrlKey: true, key: 's', preventDefault() { prevented = true; } });
  assert.ok(prevented);
  h.resolve(undefined);
  await flush();
  assert.match(h.status(h.render()), /Could not save/);
  h.button(h.render()).props.onClick();
  h.resolve({ id: 42 });
  await flush();
  assert.equal(h.status(h.render()), 'All changes saved');
  assert.equal(h.button(h.render()).props.disabled, true);
  console.log('Editor checks passed: dirty state, concurrent saves, edits during save, refresh preservation, Ctrl+S, failure and retry.');
})().catch(error => { console.error(error); process.exitCode = 1; });
