/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');

const calls = [];
let uploadError = null;
let updateError = null;
let missingTask = false;
let fields;
const bucket = {
  async upload(path, file) { calls.push(['upload', path, file]); return { error: uploadError }; },
  async remove(paths) { calls.push(['remove', paths]); return { error: null }; },
};
const supabase = {
  storage: { from(name) { assert.equal(name, 'FileBucket'); return bucket; } },
  from(table) {
    assert.equal(table, 'tasks');
    const query = {
      update(value) { fields = value; calls.push(['update', value]); return query; },
      eq(column, value) { calls.push(['eq', column, value]); return query; },
      select() { return query; },
      async single() { return { data: missingTask ? null : { id: 10, ...fields }, error: updateError }; },
    };
    return query;
  },
};
const moduleResult = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('src/features/tasks/data/task-attachments.repository.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(code, {
  exports: moduleResult.exports, module: moduleResult, crypto, console,
  require(name) {
    if (name === '@/lib/supabase/client') return { supabase };
    if (name === '@/features/tasks/data/task-validation') return { TASK_FILE_MAX_BYTES: 25 * 1024 * 1024 };
    throw new Error(name);
  },
});
const { saveTaskAttachment } = moduleResult.exports;
const file = { name: 'report.pdf', size: 100 };
function reset() { calls.length = 0; uploadError = null; updateError = null; missingTask = false; }
(async () => {
  reset();
  await assert.rejects(saveTaskAttachment(10, 7, { ...file, size: 26 * 1024 * 1024 }), /25 MB/);
  await assert.rejects(saveTaskAttachment(10, 7, { ...file, size: 0 }), /non-empty/);
  assert.equal(calls.length, 0);
  console.log('PASS invalid attachments never upload');

  reset(); uploadError = { message: 'Storage policy denied upload' };
  await assert.rejects(saveTaskAttachment(10, 7, file), /Storage policy denied/);
  assert.equal(calls.length, 1);
  console.log('PASS upload errors are surfaced without changing task metadata');

  reset();
  const first = await saveTaskAttachment(10, 7, file);
  const second = await saveTaskAttachment(10, 7, file);
  assert.notEqual(first.file_name, second.file_name);
  assert.equal(first.folder_name, 'user-7');
  assert.equal(calls.filter(call => call[0] === 'update').length, 2);
  assert.ok(calls.filter(call => call[0] === 'update').every(call => call[1].folder_name && call[1].file_name));
  assert.ok(calls.some(call => call[0] === 'eq' && call[1] === 'id' && call[2] === 10));
  console.log('PASS repeated filenames get unique paths and metadata updates atomically');

  for (const failure of ['denied', 'missing']) {
    reset();
    if (failure === 'denied') updateError = { message: 'Update denied' }; else missingTask = true;
    await assert.rejects(saveTaskAttachment(10, 7, file), /Could not save attachment/);
    assert.equal(calls.filter(call => call[0] === 'remove').length, 1);
    assert.equal(calls.find(call => call[0] === 'remove')[1][0], calls[0][1]);
  }
  console.log('PASS failed or missing task updates clean up only the new upload');
})().catch(error => { console.error(error); process.exitCode = 1; });
