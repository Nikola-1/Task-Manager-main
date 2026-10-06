const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const source = fs.readFileSync('src/features/tasks/components/ListModal/ListModal.tsx', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const flush = () => new Promise(resolve => setImmediate(resolve));
function harness(editing = false, fail = false) {
  let cursor = 0, first = true, effects = [], pending;
  const slots = [], writes = [], updates = [], filters = [];
  const jsx = (type, props) => ({ type, props });
  const query = {
    insert(payload) { writes.push(['insert', payload]); return query; },
    update(payload) { writes.push(['update', payload]); return query; },
    eq(key, value) { filters.push([key, value]); return query; },
    select() { return query; },
    single() { return new Promise(resolve => { pending = () => resolve(fail ? { error: { message: 'Denied' }, data: null } : { error: null, data: { id: 12 } }); }); }
  };
  const modules = {
    react: {
      useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
      useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
      useId: () => 'test-id', useEffect(effect) { if (first) effects.push(effect); }
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-dom': { createPortal: value => value },
    '@fortawesome/free-solid-svg-icons': {}, '@fortawesome/react-fontawesome': { FontAwesomeIcon: 'icon' },
    'next/image': { default: 'image' },
    '@/lib/supabase/client': { supabase: { from: () => query } },
    '@/features/auth/context/AuthContext': { useAuth: () => ({ user: { id: 5 } }) },
    '@/features/groups/context/ScopeContext': { useScope: () => ({ groupId: 8 }) },
    '@/lib/supabase/stickers.repository': { getStickers: async () => [] }
  };
  const context = { exports: {}, require: name => modules[name], document: { body: { style: {} }, activeElement: null } };
  vm.runInNewContext(compiled, context);
  const props = { isActive: true, Mode: editing ? 'Update' : 'Insert', editListItem: { id: 12, name: 'Old', Stickers: { id: 2, sticker_path: 'work' } }, categoryId: 12,
    setActive: value => updates.push(['active', value]), setEditListItem() {}, setnameCategory() {}, onUpdate: () => updates.push(['refresh']),
    setTaskFilter: value => updates.push(['filter', value]), setFilterImage: value => updates.push(['image', value]) };
  const dialog = context.exports.default(props);
  function render() {
    cursor = 0;
    const tree = dialog.type(dialog.props);
    effects.splice(0).forEach(effect => effect()); first = false;
    return tree;
  }
  function nodes(tree) {
    if (!tree || typeof tree !== 'object') return [];
    const children = tree.props?.children;
    return [tree, ...(Array.isArray(children) ? children.flatMap(nodes) : nodes(children))];
  }
  return { render, nodes, writes, updates, filters, finish: () => pending(),
    name(value) { nodes(render()).find(n => n.type === 'input').props.onChange({ target: { value } }); },
    submit() { nodes(render()).find(n => n.type === 'form').props.onSubmit({ preventDefault() {} }); } };
}
(async () => {
  const add = harness(); add.render(); await flush();
  add.submit(); assert.equal(add.writes.length, 0, 'Reject empty name');
  add.name('  Work  '); add.submit(); add.submit();
  assert.equal(add.writes.length, 1, 'Prevent duplicate requests');
  assert.deepEqual(JSON.parse(JSON.stringify(add.writes[0])), ['insert', { name: 'Work', sticker_id: null, user_id: 5, group_id: 8 }]);
  assert.equal(add.updates.length, 0, 'Keep modal open until saved');
  add.finish(); await flush();
  assert.ok(add.updates.some(([key, value]) => key === 'active' && value === false));
  assert.ok(add.updates.some(([key]) => key === 'refresh'));
  const edit = harness(true); edit.render(); await flush(); edit.name('Updated'); edit.submit();
  assert.deepEqual(JSON.parse(JSON.stringify(edit.writes[0])), ['update', { name: 'Updated', sticker_id: 2 }]);
  assert.deepEqual(edit.filters, [['id', 12], ['user_id', 5]]);
  edit.finish(); await flush(); assert.ok(edit.updates.some(([key, value]) => key === 'filter' && value === 'Updated'));
  const failed = harness(false, true); failed.render(); await flush(); failed.name('Draft'); failed.submit(); failed.finish(); await flush();
  assert.equal(failed.updates.length, 0, 'Keep failed draft open');
  assert.ok(failed.nodes(failed.render()).some(n => n.props?.role === 'alert'));
  console.log('Category modal checks passed: empty name, trim, fresh draft, scope, duplicate save, confirmation, edit and failure.');
})().catch(error => { console.error(error); process.exitCode = 1; });
