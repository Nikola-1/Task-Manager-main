/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');
const modules = new Map();
const jar = new Map();
let enabled = true;
let oauthOptions;
let exchanged = '';
let checkedToken = '';
let rpcCalls = [];
let rpcError = null;
let exchangeError = null;
let verifiedError = null;
let identity = { id: '11111111-1111-4111-8111-111111111111', email_confirmed_at: '2026-01-01', identities: [{ provider: 'google' }] };
const auth = {
  async signInWithOAuth(options) {
    assert.equal(options.provider, 'google');
    assert.equal(options.options.skipBrowserRedirect, true);
    await oauthOptions.storage.setItem('helptask-google-code-verifier', 'test-verifier');
    return { data: { url: 'https://example.supabase.co/auth/v1/authorize?provider=google' }, error: null };
  },
  async exchangeCodeForSession(code) {
    exchanged = code;
    return { data: { session: exchangeError ? null : { access_token: 'verified-access-token' } }, error: exchangeError };
  },
  async getUser(token) { checkedToken = token; return { data: { user: identity }, error: verifiedError }; },
};
const db = { async rpc(name, args) {
  rpcCalls.push([name, args]);
  return { data: rpcError ? null : { id: 7, Username: 'google-test' }, error: rpcError };
} };
function load(path) {
  if (modules.has(path)) return modules.get(path);
  const result = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    exports: result.exports, module: result, Request, Response, URL, Buffer, console,
    process: { env: { NODE_ENV: 'test', SUPABASE_SERVICE_ROLE_KEY: 'test-service-key' } },
    fetch: async () => Response.json({ external: { google: enabled } }),
    require(name) {
      if (name === '@supabase/supabase-js') return { createClient: (_, key, options) => {
        if (key === 'test-service-key') return db;
        oauthOptions = options.auth;
        return { auth };
      } };
      if (name === 'next/headers') return { cookies: async () => ({
        get: key => jar.get(key), set: (key, value, options) => jar.set(key, { value, options }), delete: key => jar.delete(key),
      }) };
      if (name === 'node:crypto') return crypto;
      if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
      throw new Error(name);
    },
  });
  modules.set(path, result.exports);
  return result.exports;
}
const start = load('src/app/api/auth/google/route.ts');
const callback = load('src/app/api/auth/google/callback/route.ts');
const helpers = load('src/lib/server/user-data.ts');
function post(origin = 'http://localhost:3000') {
  return new Request('http://0.0.0.0:3000/api/auth/google', { method: 'POST', headers: { Host: 'localhost:3000', Origin: origin } });
}
function back(query) { return callback.GET(new Request(`http://localhost:3000/api/auth/google/callback?${query}`)); }
(async () => {
  enabled = false;
  assert.equal((await start.POST(post())).status, 503);
  assert.equal(jar.size, 0);
  enabled = true;
  assert.equal((await start.POST(post('https://elsewhere.example'))).status, 403);
  console.log('PASS disabled Google provider and cross-origin starts fail safely');

  const started = await start.POST(post());
  assert.equal(started.status, 200);
  assert.ok((await started.json()).url.includes('provider=google'));
  assert.equal(oauthOptions.flowType, 'pkce');
  const cookie = jar.get('helptask-google-verifier');
  assert.equal(cookie.options.httpOnly, true);
  assert.equal(cookie.options.sameSite, 'lax');
  assert.equal(cookie.options.path, '/api/auth/google');
  assert.equal(cookie.options.maxAge, 600);
  oauthOptions.storage.setItem('helptask-google', 'private-session');
  assert.equal(jar.size, 1);
  console.log('PASS PKCE verifier uses a short-lived HttpOnly cookie and tokens are not persisted');

  assert.equal((await back('error=access_denied')).headers.get('Location'), '/?auth_error=google_cancelled');
  assert.equal((await back('')).headers.get('Location'), '/?auth_error=google_failed');
  assert.equal(rpcCalls.length, 0);
  assert.equal(jar.has('helptask-session'), false);
  console.log('PASS cancelled or missing callbacks never create a session');

  exchangeError = { message: 'Invalid verifier' };
  assert.equal((await back('code=bad')).headers.get('Location'), '/?auth_error=google_failed');
  exchangeError = null;
  verifiedError = { message: 'Invalid token' };
  assert.equal((await back('code=test')).headers.get('Location'), '/?auth_error=google_failed');
  verifiedError = null;
  const validIdentity = identity;
  identity = { ...identity, identities: [{ provider: 'email' }] };
  assert.equal((await back('code=test')).headers.get('Location'), '/?auth_error=google_failed');
  identity = { ...validIdentity, email_confirmed_at: null };
  assert.equal((await back('code=test')).headers.get('Location'), '/?auth_error=google_failed');
  identity = validIdentity;
  assert.equal(rpcCalls.length, 0);
  console.log('PASS invalid codes, tokens, providers, and unverified emails are rejected');

  rpcError = { code: 'PGRST202', message: 'Function missing' };
  assert.equal((await back('code=test')).headers.get('Location'), '/?auth_error=google_setup');
  rpcError = { message: 'EXISTING_EMAIL' };
  assert.equal((await back('code=test')).headers.get('Location'), '/?auth_error=google_existing_email');
  assert.equal(jar.has('helptask-session'), false);
  console.log('PASS missing migration and existing legacy email return actionable errors');

  rpcError = null; rpcCalls = [];
  const completed = await back('code=one-time-code&userId=99');
  assert.equal(completed.status, 303);
  assert.equal(completed.headers.get('Location'), '/pages/Task');
  assert.equal(exchanged, 'one-time-code');
  assert.equal(checkedToken, 'verified-access-token');
  assert.equal(rpcCalls[0][0], 'sign_in_google_user');
  assert.equal(rpcCalls[0][1].p_auth_user_id, validIdentity.id);
  assert.equal(await helpers.sessionUserId(), 7);
  assert.equal(completed.headers.get('Cache-Control'), 'no-store');
  console.log('PASS verified Google identity creates the existing app session for the mapped user');
})().catch(error => { console.error(error); process.exitCode = 1; });
