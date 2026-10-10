const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const compile = file => ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText;
const context = { exports: {} };
vm.runInNewContext(compile('src/features/calendar/data/calendar.ts'), context);
const { monthDays, localDateKey, tagColor, tasksByDate } = context.exports;
for (const month of [new Date(2024, 1, 1), new Date(2026, 1, 1), new Date(2026, 7, 1), new Date(2026, 11, 1)]) {
  const days = monthDays(month);
  assert.equal(days.length % 7, 0); assert.equal(days[0].getDay(), 1); assert.equal(days.at(-1).getDay(), 0);
  assert.equal(days.filter(day => day.getMonth() === month.getMonth()).length, new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate());
  assert.equal(new Set(days.map(localDateKey)).size, days.length);
}
assert.equal(tagColor('#f80'), '#ff8800'); assert.equal(tagColor(null), '#60a5fa'); assert.equal(tagColor('url(test)'), '#60a5fa');
assert.equal(tasksByDate([{ date: '2026-10-06', id: 1 }, { date: '2026-10-06', id: 2 }]).get('2026-10-06').length, 2);
let failTable = null; let empty = false; const calls = [];
const task = { id: 1, name: 'Task', date: '2026-10-06', Completed: false, category: { name: 'Reading', Stickers: { sticker_path: 'book' } }, tags_tasks: [{ Tags: { id: 2, name: 'Work', color: '#ff8800' } }, { Tags: null }, { Tags: { id: 2, name: 'Work', color: '#ff8800' } }] };
const supabase = { from(table) {
  calls.push(['from', table]);
  const data = empty ? [] : table === 'tasks' ? [task, { ...task, id: 2, name: null, Completed: null, category: null, tags_tasks: null }, { ...task, id: 4, date: null }] : [{ tasks: task }, { tasks: { ...task, id: 3, tags_tasks: [{ Tags: { id: 5, name: null, color: null } }] } }, { tasks: null }];
  const query = new Proxy({}, { get(_, key) {
    if (key === 'then') return resolve => resolve({ data: table === failTable ? null : data, error: table === failTable ? { message: 'Denied' } : null });
    return (...args) => { calls.push([table, key, ...args]); return query; };
  } }); return query;
} };
const repository = { exports: {}, require: () => ({ supabase }) };
vm.runInNewContext(compile('src/features/calendar/data/calendar.repository.ts'), repository);
(async () => {
  const tasks = await repository.exports.getCalendarTasks(7, null, '2026-10-01', '2026-11-01');
  assert.equal(JSON.stringify(tasks.map(task => task.id)), '[1,2,3]');
  assert.equal(tasks[0].tags.length, 1); assert.equal(tasks[0].category.stickerPath, 'book');
  assert.equal(tasks[1].name, 'Untitled task'); assert.equal(tasks[1].Completed, false); assert.equal(tasks[2].tags[0].name, 'Tag');
  for (const [table, prefix, userColumn] of [['tasks', '', 'user_id'], ['Users_Tasks', 'tasks.', 'User_id']]) {
    assert.ok(calls.some(([t, method, key, value]) => t === table && method === 'eq' && key === userColumn && value === 7));
    assert.ok(calls.some(([t, method, key, operator, value]) => t === table && method === 'not' && key === prefix + 'Deleted' && operator === 'is' && value === true));
    assert.ok(calls.some(([t, method, key]) => t === table && method === 'is' && key === prefix + 'Group_id'));
    assert.ok(calls.some(([t, method, key, value]) => t === table && method === 'gte' && key === prefix + 'date' && value === '2026-10-01'));
    assert.ok(calls.some(([t, method, key, value]) => t === table && method === 'lte' && key === prefix + 'date' && value === '2026-11-01'));
  }
  assert.equal(calls.filter(([method]) => method === 'from').length, 2);
  calls.length = 0;
  await repository.exports.getCalendarTasks(7, 4, '2026-10-01', '2026-11-01');
  for (const [table, key] of [['tasks', 'Group_id'], ['Users_Tasks', 'tasks.Group_id']]) assert.ok(calls.some(([t, method, column, value]) => t === table && method === 'eq' && column === key && value === 4));
  for (const table of ['tasks', 'Users_Tasks']) { failTable = table; await assert.rejects(repository.exports.getCalendarTasks(7, null, '2026-10-01', '2026-11-01'), /Denied/); }
  failTable = null; empty = true;
  assert.equal((await repository.exports.getCalendarTasks(7, null, '2026-10-01', '2026-11-01')).length, 0);
  console.log('Calendar checks passed: months, dates, colors, ownership/assignment union, deduplication, scope, embedded icons, empty results and errors.');
})().catch(error => { console.error(error); process.exitCode = 1; });
