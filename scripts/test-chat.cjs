const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const compile = file => ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const jsx = (type, props) => ({ type, props });
const types = { friendName: friend => friend.Name || friend.Username };
const storage = new Map();
function chatHarness(friendId = 2, failStorage = false) {
  const slots = []; let cursor = 0, first = true; const effects = [];
  const modules = {
    react: {
      useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = value; }]; },
      useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
      useEffect(effect) { if (first) effects.push(effect); }
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '@fortawesome/react-fontawesome': { FontAwesomeIcon: 'icon' }, '@fortawesome/free-solid-svg-icons': {},
    '@/features/chat/data/chat.types': types
  };
  const context = { exports: {}, Date, crypto: { randomUUID: () => `message-${storage.size}` }, require: name => modules[name],
    localStorage: { getItem: key => storage.get(key) ?? null, setItem(key, value) { if (failStorage) throw new Error('Quota exceeded'); storage.set(key, value); } } };
  vm.runInNewContext(compile('src/features/chat/components/ChatComponent.tsx'), context);
  assert.equal(context.exports.default({}).type, 'section', 'Missing friend has safe empty state');
  const child = context.exports.default({ userId: 1, friend: { id: friendId, Name: 'Friend', Username: 'friend' } });
  const nodes = tree => !tree || typeof tree !== 'object' ? [] : [tree, ...(Array.isArray(tree.props?.children) ? tree.props.children.flatMap(nodes) : nodes(tree.props?.children))];
  const render = () => { cursor = 0; const tree = child.type(child.props); effects.splice(0).forEach(effect => effect()); first = false; return tree; };
  return { render, nodes,
    edit(value) { nodes(render()).find(node => node.type === 'textarea').props.onChange({ target: { value } }); },
    send() { nodes(render()).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); }
  };
}
(async () => {
  const chat = chatHarness(); chat.render(); chat.send(); assert.equal(storage.size, 0, 'Ignore empty message');
  chat.edit('  Hello  '); chat.send();
  const messages = JSON.parse(storage.get('help-task:chat:1:2'));
  assert.equal(messages[0].content, 'Hello');
  assert.equal(chat.nodes(chat.render()).find(node => node.type === 'textarea').props.value, '');
  const restored = chatHarness(); restored.render();
  assert.ok(restored.nodes(restored.render()).some(node => node.type === 'p' && node.props.children === 'Hello'));
  const other = chatHarness(3); other.render();
  assert.ok(!other.nodes(other.render()).some(node => node.props?.children === 'Hello'), 'Conversations stay separate');
  const failed = chatHarness(4, true); failed.render(); failed.edit('Keep draft'); failed.send();
  assert.equal(failed.nodes(failed.render()).find(node => node.type === 'textarea').props.value, 'Keep draft');
  assert.ok(failed.nodes(failed.render()).some(node => node.props?.role === 'alert'));

  const operations = [];
  const query = new Proxy({}, { get(_, key) {
    if (key === 'then') return resolve => resolve({ data: [], error: null });
    return (...args) => { operations.push([key, ...args]); return query; };
  } });
  const context = { exports: {}, require: () => ({ supabase: { from: table => { operations.push(['from', table]); return query; } } }) };
  vm.runInNewContext(compile('src/features/chat/data/chat.repository.ts'), context);
  await context.exports.searchUsers('ab', 1);
  assert.ok(operations.some(([key, value]) => key === 'select' && value === 'id, Name, Surname, Username'), 'Fetch only public profile fields');
  operations.length = 0;
  await context.exports.getFriends({ id: 1 });
  assert.ok(operations.some(([key, value]) => key === 'or' && value === 'id_user.eq.1,id_friend.eq.1'), 'Load both directions');
  await assert.rejects(context.exports.requestFriend(1, 1), /another user/);
  console.log('Chat checks passed: missing friend, empty message, persistence, isolation, storage failure, safe profile fields and friend query.');
})().catch(error => { console.error(error); process.exitCode = 1; });
