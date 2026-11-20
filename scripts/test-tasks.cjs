/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');
let responses = [], queries = [], storageCalls = [], storageError = null;
const db = {
  from(table) {
    const calls = [['from', table]];
    queries.push(calls);
    const builder = new Proxy({}, { get(_, method) {
      if (method === 'then') return (resolve, reject) => {
        assert.ok(responses.length, `Unexpected database request: ${table}`);
        return Promise.resolve(responses.shift()).then(resolve, reject);
      };
      return (...args) => { calls.push([method, ...args]); return builder; };
    } });
    return builder;
  },
  storage: { from: () => ({
    upload: async (...args) => { storageCalls.push(['upload', ...args]); return { error: storageError }; },
    remove: async (...args) => { storageCalls.push(['remove', ...args]); return { error: storageError }; },
  }) },
};
const modules = new Map();
function load(file) {
  if (modules.has(file)) return modules.get(file);
  const loaded = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { module: loaded, exports: loaded.exports, Date, Error, console, crypto: { randomUUID }, require: name => {
    if (name === '@/lib/supabase/client') return { supabase: db };
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
    throw new Error(`Unexpected dependency: ${name}`);
  } });
  modules.set(file, loaded.exports);
  return loaded.exports;
}
const { validateTaskDraft } = load('src/features/tasks/data/task-validation.ts');
const { sortTasks } = load('src/features/tasks/data/task-sort.ts');
const { createTaskWithOptions } = load('src/features/tasks/data/create-task.repository.ts');
const { permanentlyDeleteTasks } = load('src/features/tasks/data/delete-tasks.repository.ts');
const { renameTask } = load('src/features/tasks/data/tasks.repository.ts');
const draft = () => ({ name: 'Test task', date: new Date(2026, 10, 9), userId: 7, groupId: null, categoryId: null, tagIds: [], file: null });
const ok = data => ({ data, error: null });
function reset(...items) { responses = items; queries = []; storageCalls = []; storageError = null; }
const plain = value => JSON.parse(JSON.stringify(value));
let passed = 0, failed = 0;
async function check(name, run) {
  try { reset(); await run(); assert.equal(responses.length, 0); passed++; console.log(`PASS ${name}`); }
  catch (error) { failed++; console.error(`FAIL ${name}: ${error.message}`); }
}
(async () => {
  await check('valid draft and exact name/file limits', () => {
    assert.deepEqual(plain(validateTaskDraft(draft())), {});
    assert.deepEqual(plain(validateTaskDraft({ ...draft(), name: 'a'.repeat(200), file: { name: 'a.txt', size: 25 * 1024 * 1024 } })), {});
  });
  for (const name of ['', '   ', '\u200B', 'a'.repeat(201), 'first\nsecond', 'a\x7fb']) {
    await check(`reject invalid name ${JSON.stringify(name.slice(0, 20))}`, () => assert.ok(validateTaskDraft({ ...draft(), name }).name));
  }
  for (const [field, value, error] of [
    ['date', null, 'date'], ['date', new Date('bad'), 'date'], ['userId', undefined, 'user'],
    ['groupId', -1, 'group'], ['categoryId', 0, 'category'], ['tagIds', [1, 1.5], 'tags'],
    ['priority', 'urgent', 'priority'], ['file', { name: 'empty', size: 0 }, 'file'],
    ['file', { name: 'big', size: 25 * 1024 * 1024 + 1 }, 'file'],
  ]) await check(`reject invalid ${field} (${String(value)})`, () => assert.ok(validateTaskDraft({ ...draft(), [field]: value })[error]));
  const tasks = [{ id: 1, date: null }, { id: 2, date: '2026-11-10' }, { id: 3, date: '2026-11-09' }, { id: 4, date: 'bad' }];
  for (const [order, expected] of [['date-asc', [3, 2, 1, 4]], ['date-desc', [2, 3, 1, 4]], ['priority-desc', [2, 3, 1, 4]], ['priority-asc', [3, 2, 1, 4]]]) {
    await check(`${order}: missing values last, source unchanged`, () => {
      assert.deepEqual(plain(sortTasks(tasks, order, { 2: 'high', 3: 'low' }).map(t => t.id)), expected);
      assert.deepEqual(tasks.map(t => t.id), [1, 2, 3, 4]);
    });
  }
  await check('invalid creation never reaches database', async () => {
    await assert.rejects(createTaskWithOptions({ ...draft(), name: ' ' }));
    assert.equal(queries.length, 0);
  });
  await check('creation trims name, preserves local date and deduplicates tags', async () => {
    reset(ok({ id: 42 }), ok(null), ok(null));
    assert.equal(await createTaskWithOptions({ ...draft(), name: ' Test ', tagIds: [3, 3] }), 42);
    const payload = queries[0].find(c => c[0] === 'insert')[1];
    assert.equal(payload.name, 'Test'); assert.equal(payload.date, '2026-11-09');
    assert.deepEqual(plain(queries[1][1]), ['insert', { User_id: 7, Task_id: 42 }]);
    assert.equal(queries[2][1][1].length, 1);
  });
  await check('assignment failure rolls back task, links and uploaded file', async () => {
    reset(ok({ id: 42 }), { error: new Error('assignment failed') }, ok(null), ok(null), ok(null));
    await assert.rejects(createTaskWithOptions({ ...draft(), file: { name: 'test.txt', size: 10 } }), /assignment failed/);
    assert.deepEqual(queries.slice(2).map(q => q[0][1]), ['tags_tasks', 'Users_Tasks', 'tasks']);
    for (const query of queries.slice(2)) assert.ok(query.some(c => c[0] === 'eq' && c[2] === 42));
    assert.equal(storageCalls[1][0], 'remove');
    assert.equal(storageCalls[1][1][0], storageCalls[0][1]);
  });
  await check('failed rollback warns against blind retry', async () => {
    reset(ok({ id: 42 }), { error: new Error('failed') }, { error: new Error('cleanup') }, ok(null), ok(null));
    await assert.rejects(createTaskWithOptions(draft()), /Some data may have been saved/);
  });
  await check('empty permanent deletion is a no-op', async () => {
    await permanentlyDeleteTasks([]); assert.equal(queries.length, 0);
  });
  await check('permanent deletion preserves shared attachments', async () => {
    reset(ok([{ id: 42, folder_name: 'user-7', file_name: 'shared.txt' }]), { count: 1, error: null }, ok(null));
    await permanentlyDeleteTasks([42]); assert.equal(storageCalls.length, 0);
    assert.ok(queries[2].some(c => c[0] === 'eq' && c[1] === 'Deleted' && c[2] === true));
  });
  await check('storage failure keeps task metadata for retry', async () => {
    reset(ok([{ id: 42, folder_name: 'user-7', file_name: 'a.txt' }]), { count: 0, error: null });
    storageError = new Error('offline');
    await assert.rejects(permanentlyDeleteTasks([42]), /attachments/);
    assert.equal(queries.length, 2);
  });
  await check('rename rejects blank input before writing', async () => {
    await assert.rejects(renameTask(42, '  ')); assert.equal(queries.length, 0);
  });
  await check('rename enforces the same name limit as creation', async () => {
    await assert.rejects(renameTask(42, 'a'.repeat(201)), /200/);
    assert.equal(queries.length, 0);
  });
  console.log(`${passed} passed, ${failed} failed.`);
  process.exitCode = failed ? 1 : 0;
})();
