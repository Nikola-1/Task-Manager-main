const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
let members = [1, 2, 3]; let assigned = [1, 3]; let group = 5; let deleted = false; let denied = false; const writes = [];
const supabase = { from(table) {
  let inserting = false;
  const q = new Proxy({}, { get(_, key) {
    if (key === 'then') return resolve => resolve({ error: denied ? { message: 'Denied' } : null, data: inserting ? null : table === 'tasks' ? { id: 10, user_id: 1, Group_id: group, Deleted: deleted } : table === 'Users_Groups' ? members.map(id => ({ id_user: id, Users: { id, Username: `User ${id}` } })) : assigned.map(User_id => ({ User_id })) });
    return (...args) => { if (key === 'insert') { inserting = true; writes.push(args[0]); } return q; };
  } }); return q;
} };
const context = { exports: {}, require: () => ({ supabase }) };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/features/tasks/data/task-sharing.repository.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, context);
(async () => {
  const { getTaskRecipients, sendTaskToMember } = context.exports;
  const recipients = await getTaskRecipients(10, 5, 1);
  assert.equal(JSON.stringify(recipients.map(r => [r.id, r.assigned])), '[[2,false],[3,true]]');
  assert.equal(await sendTaskToMember(10, 5, 1, 2), true);
  assert.equal(JSON.stringify(writes), '[{"User_id":2,"Task_id":10}]');
  assert.equal(await sendTaskToMember(10, 5, 1, 3), false); assert.equal(writes.length, 1);
  await assert.rejects(sendTaskToMember(10, 5, 1, 1), /another member/);
  await assert.rejects(sendTaskToMember(10, 5, 1, 99), /another member/);
  members = [1, 3]; await assert.rejects(sendTaskToMember(10, 5, 1, 2), /another member/);
  members = [2, 3]; await assert.rejects(sendTaskToMember(10, 5, 1, 2), /within your group/);
  members = [1, 2, 3]; group = 6; await assert.rejects(sendTaskToMember(10, 5, 1, 2), /within your group/);
  group = 5; deleted = true; await assert.rejects(sendTaskToMember(10, 5, 1, 2), /within your group/);
  deleted = false; await assert.rejects(sendTaskToMember(10, 5, 2, 3), /not assigned/);
  assigned = [1, 2]; assert.equal(await sendTaskToMember(10, 5, 2, 3), true);
  denied = true; await assert.rejects(getTaskRecipients(10, 5, 1), /Denied/);
  assert.equal(writes.length, 2);
  console.log('Task sharing passed: group membership, ownership/assignment, recipient validation, existing assignments, deleted tasks and errors.');
})().catch(error => { console.error(error); process.exitCode = 1; });
