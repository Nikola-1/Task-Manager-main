const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
let failure = null;
const calls = [];
const supabase = {
  from(table) {
    let operation = 'select';
    const query = new Proxy({}, { get(_, method) {
      if (method === 'then') return resolve => resolve({
        data: table === 'tasks' ? { id: 42 } : [{ id: 3, name: 'Choice' }],
        error: failure === `${table}:${operation}` ? { message: 'Denied' } : null,
      });
      return (...args) => {
        if (method === 'insert' || method === 'delete') operation = method;
        calls.push([table, method, ...args]);
        return query;
      };
    } });
    return query;
  },
  storage: { from(bucket) {
    assert.equal(bucket, 'FileBucket');
    return {
      async upload(path, file) { calls.push(['storage', 'upload', path, file]); return { error: failure === 'upload' ? { message: 'Upload failed' } : null }; },
      async remove(paths) { calls.push(['storage', 'remove', paths]); return { error: null }; },
    };
  } },
};
const validation = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/features/tasks/data/task-validation.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, validation);
const context = { exports: {}, require: path => path.endsWith('task-validation') ? validation.exports : { supabase }, crypto: { randomUUID: () => 'unique' } };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/features/tasks/data/create-task.repository.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, context);
const { createTaskWithOptions, getTaskCreationChoices } = context.exports;
const options = { name: '  New task  ', date: new Date(2026, 9, 14), userId: 7, groupId: null, categoryId: 3, tagIds: [2, 4, 2], file: { name: 'notes.pdf', size: 1024 } };
const reset = fail => { failure = fail; calls.length = 0; };
(async () => {
  reset(null);
  assert.equal(await createTaskWithOptions(options), 42);
  const payload = calls.find(([table, method]) => table === 'tasks' && method === 'insert')[2];
  assert.equal(payload.name, 'New task'); assert.equal(payload.date, '2026-10-14');
  assert.equal(payload.category_id, 3); assert.equal(payload.folder_name, 'user-7');
  assert.equal(payload.file_name, 'unique-notes.pdf'); assert.equal(payload.Group_id, null);
  const tags = calls.find(([table, method]) => table === 'tags_tasks' && method === 'insert')[2];
  assert.equal(JSON.stringify(tags), JSON.stringify([{ id_tag: 2, id_task: 42, user_id: 7 }, { id_tag: 4, id_task: 42, user_id: 7 }]));
  assert.ok(calls.some(([table, method]) => table === 'Users_Tasks' && method === 'insert'));
  reset(null);
  await createTaskWithOptions({ ...options, file: null, categoryId: null, tagIds: [], groupId: 9 });
  assert.ok(!calls.some(([table]) => table === 'storage' || table === 'tags_tasks'));
  assert.equal(calls.find(([table, method]) => table === 'tasks' && method === 'insert')[2].Group_id, 9);
  for (const fail of ['upload', 'tasks:insert', 'Users_Tasks:insert', 'tags_tasks:insert']) {
    reset(fail);
    await assert.rejects(() => createTaskWithOptions(options));
    if (fail === 'upload') assert.ok(!calls.some(([table]) => table === 'tasks'));
    else assert.ok(calls.some(([table, method]) => table === 'storage' && method === 'remove'));
    if (fail === 'Users_Tasks:insert' || fail === 'tags_tasks:insert') {
      assert.ok(calls.some(([table, method]) => table === 'tasks' && method === 'delete'));
      assert.ok(calls.filter(([, method]) => method === 'eq').every(([, , , id]) => id === 42));
    }
  }
  reset(null);
  await getTaskCreationChoices(7, null);
  assert.ok(calls.some(([table, method, field, id]) => table === 'Categories' && method === 'eq' && field === 'user_id' && id === 7));
  assert.ok(calls.some(([table, method, field, id]) => table === 'Tags' && method === 'eq' && field === 'User_id' && id === 7));
  reset(null);
  await getTaskCreationChoices(7, 9);
  assert.equal(calls.filter(([, method, field, id]) => method === 'eq' && field === 'group_id' && id === 9).length, 2);
  reset('Tags:select'); await assert.rejects(() => getTaskCreationChoices(7, null));
  reset(null); await assert.rejects(() => createTaskWithOptions({ ...options, name: ' ' })); assert.equal(calls.length, 0);
  const { validateTaskDraft, TASK_FILE_MAX_BYTES, TASK_NAME_MAX_LENGTH } = validation.exports;
  const invalid = [
    ['name', { name: '\u200B\uFEFF' }], ['name', { name: 'x'.repeat(TASK_NAME_MAX_LENGTH + 1) }],
    ['name', { name: 'one\ntwo' }], ['date', { date: null }], ['date', { date: new Date('invalid') }],
    ['user', { userId: undefined }], ['user', { userId: 0 }], ['group', { groupId: -1 }],
    ['category', { categoryId: 1.5 }], ['tags', { tagIds: [0] }], ['priority', { priority: 'urgent' }],
    ['file', { file: { name: 'empty.txt', size: 0 } }],
    ['file', { file: { name: 'large.pdf', size: TASK_FILE_MAX_BYTES + 1 } }],
  ];
  for (const [field, changes] of invalid) {
    const draft = { ...options, ...changes };
    assert.ok(validateTaskDraft(draft)[field], field);
    reset(null); await assert.rejects(() => createTaskWithOptions(draft));
    assert.equal(calls.length, 0, `Invalid ${field} must not upload or write to the database`);
  }
  assert.equal(Object.keys(validateTaskDraft({ ...options, name: 'x'.repeat(TASK_NAME_MAX_LENGTH), file: { name: 'limit.pdf', size: TASK_FILE_MAX_BYTES } })).length, 0);
  assert.equal(Object.keys(validateTaskDraft({ ...options, name: 'Čitaj 📖', date: new Date(2020, 0, 1), categoryId: null, tagIds: [], file: null, priority: 'none' })).length, 0);
  console.log('PASS: task options, multiple tags, attachment upload, scope filtering, failure cleanup and validation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
