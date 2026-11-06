/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner */
// Exercise the actual route handlers with an in-memory cookie jar and mocked
// database transport. No Supabase keys or network connection are required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');

const jar = new Map();
const queries = [];
let responses = [];
const db = { from(table) {
  const calls = [['from', table]];
  queries.push(calls);
  const builder = new Proxy({}, { get(_, method) {
    if (method === 'then') return (resolve, reject) => Promise.resolve(responses.shift() ?? { data: null, error: null }).then(resolve, reject);
    return (...args) => { calls.push([method, ...args]); return builder; };
  } });
  return builder;
} };
const environment = { env: { NODE_ENV: 'test', SUPABASE_SERVICE_ROLE_KEY: 'unit-test-key' } };
const modules = new Map();
function load(relative) {
  if (modules.has(relative)) return modules.get(relative);
  const result = { exports: {} };
  const source = fs.readFileSync(path.resolve(relative), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const localRequire = name => {
    if (name === '@supabase/supabase-js') return { createClient: () => db };
    if (name === 'next/headers') return { cookies: async () => ({
      set: (key, value, options) => jar.set(key, { value, options }), get: key => jar.get(key), delete: key => jar.delete(key),
    }) };
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
    return require(name);
  };
  vm.runInNewContext(code, { exports: result.exports, module: result, require: localRequire, process: environment, Buffer, Response, Request, console, URL, Intl, Date });
  modules.set(relative, result.exports);
  return result.exports;
}
const helpers = load('src/lib/server/user-data.ts');
const routes = load('src/app/api/user-data/route.ts');
const session = load('src/app/api/session/route.ts');
const habitId = '11111111-1111-4111-8111-111111111111';
const messageId = '22222222-2222-4222-8222-222222222222';
function request(resource, body, method = body === undefined ? 'GET' : 'POST', origin = 'http://localhost:3000') {
  return new Request(`http://localhost:3000/api/user-data?resource=${resource}`, {
    method, headers: { Origin: origin, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body),
  });
}
function reset(...results) { responses = results; queries.length = 0; }
const ok = data => ({ data, error: null });
let count = 0;
async function check(name, run) { await run(); count++; console.log(`PASS ${name}`); }

(async () => {
  await check('unauthenticated requests cannot reach database', async () => {
    reset(); jar.clear();
    assert.equal((await routes.GET(request('habits'))).status, 401);
    assert.equal(queries.length, 0);
  });
  await check('signed session uses HttpOnly cookie and rejects tampering/expiration', async () => {
    await helpers.createSession(7);
    const cookie = jar.get('helptask-session');
    assert.equal(cookie.options.httpOnly, true);
    assert.equal(await helpers.sessionUserId(), 7);
    jar.set('helptask-session', { value: `${cookie.value}bad` });
    await assert.rejects(helpers.sessionUserId(), error => error.status === 401);
    const payload = Buffer.from(JSON.stringify({ id: 7, expires: 1 })).toString('base64url');
    const signature = crypto.createHmac('sha256', 'unit-test-key').update(`helptask-session:${payload}`).digest('base64url');
    jar.set('helptask-session', { value: `${payload}.${signature}` });
    await assert.rejects(helpers.sessionUserId(), error => error.status === 401);
    await helpers.createSession(7);
  });
  await check('cross-origin writes are rejected before database access', async () => {
    reset();
    assert.equal((await routes.POST(request('habits', {}, 'POST', 'https://elsewhere.example'))).status, 403);
    assert.equal(queries.length, 0);
  });
  await check('logout checks the browser host when the internal server address differs', async () => {
    await helpers.createSession(7);
    const logoutRequest = origin => new Request('http://0.0.0.0:3000/api/session', {
      method: 'DELETE', headers: { Host: 'localhost:3000', Origin: origin },
    });
    assert.equal((await session.DELETE(logoutRequest('http://elsewhere.example'))).status, 403);
    assert.equal(await helpers.sessionUserId(), 7);
    assert.equal((await session.DELETE(logoutRequest('http://localhost:3001'))).status, 403);
    assert.equal((await session.DELETE(new Request('http://0.0.0.0:3000/api/session', {
      method: 'DELETE', headers: { Host: 'localhost:3000' },
    }))).status, 403);
    assert.equal((await session.DELETE(logoutRequest('http://localhost:3000'))).status, 200);
    assert.equal(jar.size, 0);
    await helpers.createSession(7);
  });
  await check('priority writes require ownership or task assignment', async () => {
    reset(ok({ id: 10, user_id: 99 }), ok([]));
    assert.equal((await routes.POST(request('priorities', { taskId: 10, priority: 'high', userId: 99 }))).status, 403);
    assert.equal(queries.length, 2);
    reset(ok({ id: 10, user_id: 99 }), ok([{ Task_id: 10 }]), ok(null));
    assert.equal((await routes.POST(request('priorities', { taskId: 10, priority: 'high', userId: 99 }))).status, 200);
    assert.ok(queries[2].some(call => call[0] === 'upsert' && call[1].user_id === 7));
  });
  await check('unread count belongs to the signed-in recipient', async () => {
    reset({ data: null, count: 4, error: null });
    const response = await routes.GET(request('unread-messages&userId=99'));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).count, 4);
    assert.ok(queries[0].some(call => call[0] === 'eq' && call[1] === 'recipient_id' && call[2] === 7));
    assert.ok(queries[0].some(call => call[0] === 'is' && call[1] === 'read_at' && call[2] === null));
    assert.ok(queries[0].some(call => call[0] === 'select' && call[2].head === true && call[2].count === 'exact'));
  });
  await check('group notifications only include session memberships and exclude owned groups', async () => {
    reset(ok([{ id_group: 10 }, { id_group: 11 }, { id_group: 10 }]));
    const response = await routes.GET(request('group-memberships&userId=99'));
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).groupIds, [10, 11]);
    assert.ok(queries[0].some(call => call[0] === 'eq' && call[1] === 'id_user' && call[2] === 7));
    assert.ok(queries[0].some(call => call[0] === 'neq' && call[1] === 'Groups.Admin' && call[2] === 7));
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  });
  await check('notifications seed silently and only fetch new incoming messages for this session', async () => {
    const row = { id: messageId, sender_id: 9, content: 'Hello', created_at: '2026-01-01T12:00:00.123456+00:00', sender: { Name: 'Test', Surname: 'Friend', Username: 'test' } };
    reset(ok([row]));
    const initial = await routes.GET(request('message-notifications'));
    const seed = await initial.json();
    assert.equal(initial.status, 200);
    assert.equal(seed.messages.length, 0);
    assert.equal(seed.cursor, `${row.created_at}|${messageId}`);
    reset(ok([row]));
    const response = await routes.GET(request(`message-notifications&userId=99&after=${encodeURIComponent(seed.cursor)}`));
    const page = await response.json();
    assert.equal(page.messages[0].senderName, 'Test Friend');
    assert.equal(page.messages[0].senderId, 9);
    assert.ok(queries[0].some(call => call[0] === 'eq' && call[1] === 'recipient_id' && call[2] === 7));
    assert.ok(queries[0].some(call => call[0] === 'or' && call[1].includes('.123456+00:00') && call[1].includes(`id.gt.${messageId}`)));
    reset(ok([]));
    assert.equal((await (await routes.GET(request(`message-notifications&after=${encodeURIComponent(seed.cursor)}`))).json()).cursor, seed.cursor);
    reset();
    assert.equal((await routes.GET(request('message-notifications&after=invalid'))).status, 400);
  });
  await check('reading a conversation only updates received messages through the loaded timestamp', async () => {
    const through = '2026-01-01T12:00:00.123456+00:00';
    reset(ok(null));
    assert.equal((await routes.POST(request('read-messages', { friendId: 9, userId: 99, through }))).status, 200);
    for (const [method, field, value] of [['eq', 'recipient_id', 7], ['eq', 'sender_id', 9], ['is', 'read_at', null], ['lte', 'created_at', through]]) {
      assert.ok(queries[0].some(call => call[0] === method && call[1] === field && call[2] === value));
    }
    reset();
    assert.equal((await routes.POST(request('read-messages', { friendId: 9, through: '2999-01-01T00:00:00Z' }))).status, 400);
    assert.equal((await routes.POST(request('read-messages', { friendId: 9, through }, 'POST', 'https://elsewhere.example'))).status, 403);
    assert.equal(queries.length, 0);
  });
  await check('invalid priority is rejected', async () => {
    reset();
    assert.equal((await routes.POST(request('priorities', { taskId: 10, priority: 'urgent' }))).status, 400);
    assert.equal(queries.length, 0);
  });
  await check('habit updates and deletion cannot target another user', async () => {
    reset(ok(null));
    assert.equal((await routes.POST(request('habits', { id: habitId, name: 'Read', period: 'Morning', icon: 'read' }))).status, 404);
    assert.ok(queries[0].some(call => call[0] === 'eq' && call[1] === 'user_id' && call[2] === 7));
    reset(ok(null));
    assert.equal((await routes.DELETE(request(`habits&id=${habitId}`, undefined, 'DELETE'))).status, 404);
    assert.equal(queries.length, 1);
  });
  await check('habit creation uses session owner and matches frontend fields', async () => {
    reset(ok(null));
    assert.equal((await routes.POST(request('habits', { id: habitId, create: true, user_id: 99, name: 'Read', period: 'Evening', icon: 'read', createdOn: '2026-01-01' }))).status, 200);
    assert.ok(queries[0].some(call => call[0] === 'insert' && call[1].user_id === 7 && call[1].created_on === '2026-01-01'));
  });
  await check('completion dates are checked and unchecking removes the row', async () => {
    reset(ok({ id: habitId, created_on: '2026-01-01' }));
    assert.equal((await routes.POST(request('completions', { habitId, day: '2025-12-31', completed: true }))).status, 400);
    reset(ok({ id: habitId, created_on: '2026-01-01' }));
    assert.equal((await routes.POST(request('completions', { habitId, day: '2999-01-01', completed: true }))).status, 400);
    reset(ok({ id: habitId, created_on: '2026-01-01' }), ok(null));
    assert.equal((await routes.POST(request('completions', { habitId, day: '2026-01-02', completed: false }))).status, 200);
    assert.ok(queries[1].some(call => call[0] === 'delete'));
  });
  await check('chat delivery requires accepted friendship and ignores supplied sender', async () => {
    reset(ok([]));
    assert.equal((await routes.POST(request('messages', { id: messageId, friendId: 9, content: 'Hello' }))).status, 403);
    reset(ok([{ id_user: 7 }]), ok({ id: messageId, sender_id: 7, recipient_id: 9, content: 'Hello', created_at: '2026-01-01T12:00:00Z' }));
    const response = await routes.POST(request('messages', { id: messageId, friendId: 9, sender_id: 99, content: 'Hello' }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).senderId, 7);
    assert.ok(queries[1].some(call => call[0] === 'insert' && call[1].sender_id === 7));
  });
  await check('message retry is idempotent after a lost response', async () => {
    reset(ok([{ id_user: 7 }]), { data: null, error: { code: '23505' } }, ok({ id: messageId, sender_id: 7, recipient_id: 9, content: 'Hello', created_at: '2026-01-01T12:00:00Z' }));
    assert.equal((await routes.POST(request('messages', { id: messageId, friendId: 9, content: 'Hello' }))).status, 200);
  });
  await check('conversation reads are scoped to current user and preserve cursor precision', async () => {
    reset(ok([]));
    const before = encodeURIComponent(`2026-01-01T12:00:00.123456+00:00|${messageId}`);
    assert.equal((await routes.GET(request(`messages&friendId=9&before=${before}`))).status, 200);
    assert.ok(queries[0].some(call => call[0] === 'or' && call[1].includes('sender_id.eq.7,recipient_id.eq.9')));
    assert.ok(queries[0].some(call => call[0] === 'or' && call[1].includes('.123456+00:00')));
  });
  await check('failed login never creates a session and logout clears it', async () => {
    jar.clear(); reset(ok(null));
    assert.equal((await session.POST(request('session', { username: 'wrong', password: 'wrong' }))).status, 401);
    assert.equal(jar.size, 0);
    reset(ok({ id: 7, Username: 'test' }));
    assert.equal((await session.POST(request('session', { username: 'test', password: 'test' }))).status, 200);
    assert.equal(await helpers.sessionUserId(), 7);
    assert.equal((await session.DELETE(request('session', undefined, 'DELETE'))).status, 200);
    assert.equal(jar.size, 0);
  });
  console.log(`${count} user-data checks passed.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
