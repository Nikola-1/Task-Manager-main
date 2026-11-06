/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let results = [];
let storageError = null;
const calls = [];
const supabase = {
  from(table) {
    const query = [['from', table]];
    calls.push(query);
    const builder = new Proxy({}, { get(_, method) {
      if (method === 'then') return (resolve, reject) => Promise.resolve(results.shift()).then(resolve, reject);
      return (...args) => { query.push([method, ...args]); return builder; };
    } });
    return builder;
  },
  storage: { from(bucket) {
    assert.equal(bucket, 'FileBucket');
    return { async remove(paths) { calls.push(['remove', paths]); return { error: storageError }; } };
  } },
};
const moduleResult = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('src/features/tasks/data/delete-tasks.repository.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(code, { exports: moduleResult.exports, module: moduleResult, require: () => ({ supabase }) });
const { permanentlyDeleteTasks } = moduleResult.exports;
const task = { id: 10, folder_name: 'user-7', file_name: 'report.pdf' };
const ok = data => ({ data, error: null });
const references = count => ({ count, error: null });
const hasDelete = () => calls.some(query => Array.isArray(query[0]) && query.some(call => call[0] === 'delete'));
function reset(...responses) { results = responses; calls.length = 0; storageError = null; }
(async () => {
  reset(ok([task]), references(0), ok(null));
  await permanentlyDeleteTasks([10]);
  assert.ok(calls[0].some(call => call[0] === 'eq' && call[1] === 'Deleted' && call[2] === true));
  assert.equal(calls[2][0], 'remove');
  assert.equal(calls[2][1][0], 'user-7/report.pdf');
  assert.ok(hasDelete());
  console.log('PASS permanent deletion removes the stored attachment before deleting its task');

  reset(ok([task]), references(0)); storageError = { message: 'Storage denied' };
  await assert.rejects(permanentlyDeleteTasks([10]), /Storage denied/);
  assert.equal(hasDelete(), false);
  console.log('PASS storage failure preserves task metadata for retry');

  reset(ok([task]), references(1), ok(null));
  await permanentlyDeleteTasks([10]);
  assert.equal(calls.some(call => call[0] === 'remove'), false);
  assert.ok(hasDelete());
  console.log('PASS an attachment still used by another task is preserved');

  reset(ok([task, { ...task, id: 11 }, { id: 12, folder_name: null, file_name: null }]), references(0), ok(null));
  await permanentlyDeleteTasks([10, 11, 12]);
  assert.equal(calls.filter(call => call[0] === 'remove').length, 1);
  assert.equal(calls.find(call => call[0] === 'remove')[1].length, 1);
  assert.ok(hasDelete());
  console.log('PASS emptying trash deduplicates file paths and handles tasks without attachments');

  reset(ok([]));
  await permanentlyDeleteTasks([10]);
  assert.equal(calls.length, 1);
  assert.equal(hasDelete(), false);
  console.log('PASS tasks no longer in trash cannot trigger attachment removal');
})().catch(error => { console.error(error); process.exitCode = 1; });
