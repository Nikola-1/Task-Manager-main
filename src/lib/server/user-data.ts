import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export class ApiError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

const cookieName = 'helptask-session';
const sessionSeconds = 60 * 60 * 24 * 7;
function secret() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new ApiError('Server setup required: configure SUPABASE_SERVICE_ROLE_KEY.', 503);
  return value;
}
export function database() {
  return createClient(process.env.SUPABASE_URL ?? 'https://opckmcxwoanlozwgrsab.supabase.co', secret(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
function sign(payload: string) {
  return createHmac('sha256', secret()).update(`helptask-session:${payload}`).digest('base64url');
}
export async function createSession(id: number) {
  const payload = Buffer.from(JSON.stringify({ id, expires: Date.now() + sessionSeconds * 1000 })).toString('base64url');
  (await cookies()).set(cookieName, `${payload}.${sign(payload)}`, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    path: '/', maxAge: sessionSeconds,
  });
}
export async function clearSession() { (await cookies()).delete(cookieName); }
export async function sessionUserId() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) throw new ApiError('Sign in again to access your saved data.', 401);
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) throw new ApiError('Invalid session. Sign in again.', 401);
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new ApiError('Invalid session.', 401);
  let session;
  try { session = JSON.parse(Buffer.from(payload, 'base64url').toString()); }
  catch { throw new ApiError('Invalid session.', 401); }
  if (!Number.isSafeInteger(session.id) || session.id <= 0 || !Number.isFinite(session.expires) || session.expires <= Date.now()) {
    throw new ApiError('Session expired. Sign in again.', 401);
  }
  return session.id as number;
}
export function checkOrigin(request: Request) {
  const url = new URL(request.url);
  // Next can use its internal listening address in request.url. Host retains
  // the address the browser actually requested (including the port).
  const host = request.headers.get('host') ?? url.host;
  const expectedOrigin = `${url.protocol}//${host}`;
  if (request.headers.get('origin') !== expectedOrigin) throw new ApiError('Invalid request origin.', 403);
}
export async function readBody(request: Request): Promise<Record<string, unknown>> {
  let body;
  try { body = await request.json(); } catch { throw new ApiError('Invalid JSON body.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError('Invalid request body.');
  return body;
}
export function apiError(error: unknown) {
  if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status });
  console.error('User data request failed:', error instanceof Error ? error.message : 'Database error');
  return Response.json({ error: 'Could not access saved data. Check the database setup and try again.' }, { status: 500 });
}
export function positiveId(value: unknown) {
  const id = typeof value === 'string' ? Number(value) : value;
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) throw new ApiError('Invalid ID.');
  return id;
}
export function uuid(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new ApiError('Invalid ID.');
  return value;
}
export function checkDatabase(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}
