import { apiError, ApiError, checkDatabase, checkOrigin, clearSession, createSession, database, readBody, sessionUserId } from '@/lib/server/user-data';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { username, password } = await readBody(request);
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password || username.length > 200 || password.length > 1000) {
      throw new ApiError('Enter your username and password.');
    }
    // Verify the existing custom Users credentials on the server.
    const { data, error } = await database().from('Users').select('*')
      .eq('Username', username).eq('Password', password).maybeSingle();
    checkDatabase(error);
    if (!data) throw new ApiError('Incorrect username or password.', 401);
    await createSession(data.id);
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiError(error); }
}

export async function GET() {
  try {
    const id = await sessionUserId();
    const { data, error } = await database().from('Users').select('*').eq('id', id).maybeSingle();
    checkDatabase(error);
    if (!data) throw new ApiError('Sign in again.', 401);
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    await clearSession();
    return Response.json({ success: true });
  } catch (error) { return apiError(error); }
}
