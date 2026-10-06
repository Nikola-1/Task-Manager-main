const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('src/features/tasks/hooks/useFilterTasks.tsx', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const RealDate = Date;
const fixedNow = new RealDate(2026, 9, 6, 0, 30);
class TestDate extends RealDate {
  constructor(...args) { super(...(args.length ? args : [fixedNow.getTime()])); }
}

async function checkFilter(categoryId, isCategory, tagId, isTag) {
  const queries = [];
  let fetchedTasks;
  const fixture = [{ id: 1, date: '2026-10-06' }, { id: 2, date: '2026-10-13' }, { id: 3, date: '2026-10-14' }];
  const supabase = {
    from(table) {
      const filters = [];
      queries.push({ table, filters });
      const query = {
        select() { return query; },
        eq(key, value) { filters.push(['eq', key, value]); return query; },
        is(key, value) { filters.push(['is', key, value]); return query; },
        gte(key, value) { filters.push(['gte', key, value]); return query; },
        lte(key, value) { filters.push(['lte', key, value]); return query; },
        async order() {
          return { error: null, data: fixture.filter(task => filters.every(([op, key, value]) => key !== 'tasks.date' ||
            (op === 'gte' ? task.date >= value : op === 'lte' ? task.date <= value : task.date === value))).map(tasks => ({ tasks })) };
        }
      };
      return query;
    }
  };
  const modules = {
    '@/lib/supabase/client': { supabase },
    '@/features/auth/context/AuthContext': { useAuth: () => ({ user: { id: 1 } }) },
    '@/features/groups/context/ScopeContext': { useScope: () => ({ groupId: null }) },
    react: { useState: initial => [initial, value => { if (Array.isArray(value)) fetchedTasks = value; }], useRef: value => ({ current: value }), useEffect() {} }
  };
  const sandbox = { exports: {}, Date: TestDate, console: { log() {}, error: console.error }, require: name => {
    assert.ok(modules[name], `Unexpected import: ${name}`);
    return modules[name];
  } };
  vm.runInNewContext(compiled, sandbox);
  await sandbox.exports.default('7Days', isCategory, categoryId, isTag, tagId).refresh();
  return { queries, fetchedTasks };
}
(async () => {
  for (const [categoryId, isCategory, tagId, isTag] of [[null, false, null, false], [0, true, null, false], [null, false, 4, false]]) {
    const { queries, fetchedTasks } = await checkFilter(categoryId, isCategory, tagId, isTag);
    assert.equal(queries.length, 1);
    const filters = queries[0].filters;
    assert.ok(!filters.some(([, key]) => key === 'tasks.category_id'));
    assert.ok(filters.some(([op, key, value]) => op === 'gte' && key === 'tasks.date' && value === '2026-10-06'));
    assert.ok(filters.some(([op, key, value]) => op === 'lte' && key === 'tasks.date' && value === '2026-10-13'));
    assert.deepEqual(Array.from(fetchedTasks, task => task.id), [1, 2]);
  }
  const { queries } = await checkFilter(12, true, null, false);
  assert.ok(queries[0].filters.some(([, key, value]) => key === 'tasks.category_id' && value === 12));
  console.log('7Days regression checks passed: local dates, inclusive range, category 0 fallback, inactive tags, real category filtering.');
})().catch(error => { console.error(error); process.exitCode = 1; });
