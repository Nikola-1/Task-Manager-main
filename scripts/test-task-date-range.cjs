/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let calls = [];
const query = new Proxy({}, { get(_, method) {
  if (method === 'then') return resolve => resolve({ data: [], error: null });
  return (...args) => { calls.push([method, ...args]); return query; };
} });
const loaded = { exports: {} };
const source = fs.readFileSync('src/features/tasks/data/task-date-range.ts', 'utf8');
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
  exports: loaded.exports, module: loaded, require: () => ({ supabase: query }), Date, Error,
});
const { validateTaskDateRange, getTasksInDateRange } = loaded.exports;
let count = 0;
function check(name, run) { run(); count++; console.log(`PASS ${name}`); }
(async () => {
  for (const [from, to, valid] of [
    ['2026-01-01', '2026-12-31', true], ['2026-11-10', '2026-11-10', true],
    ['2024-02-29', '2024-03-01', true], ['2026-02-29', '2026-03-01', false],
    ['2026-04-31', '2026-05-01', false], ['', '2026-11-10', false],
    ['2026-11-10', '', false], ['2026-11-11', '2026-11-10', false],
    ['2026-1-1', '2026-11-10', false], ['0000-01-01', '2026-11-10', false],
  ]) check(`validate ${from} to ${to}`, () => assert.equal(validateTaskDateRange({ from, to }) === null, valid));
  const range = { from: '2026-10-01', to: '2026-11-10' };
  for (const groupId of [null, 12]) {
    calls = [];
    await getTasksInDateRange(range, 7, groupId);
    check(`inclusive query with user and group scope (${groupId})`, () => {
      for (const expected of [
        ['eq', 'User_id', 7], ['eq', 'tasks.Deleted', false],
        ['gte', 'tasks.date', range.from], ['lte', 'tasks.date', range.to],
        [groupId === null ? 'is' : 'eq', 'tasks.Group_id', groupId],
      ]) assert.ok(calls.some(call => JSON.stringify(call) === JSON.stringify(expected)));
      assert.ok(calls.some(call => call[0] === 'select' && call[1].includes('tasks!inner')));
      assert.ok(!calls.some(call => call[1] === 'tasks.Completed'));
    });
  }
  calls = [];
  await assert.rejects(getTasksInDateRange({ from: range.to, to: range.from }, 7, null), /End date/);
  check('invalid interval never queries database', () => assert.equal(calls.length, 0));
  console.log(`${count} date-range checks passed.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
