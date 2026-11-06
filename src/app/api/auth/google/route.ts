import { apiError, ApiError, checkOrigin } from '@/lib/server/user-data';
import { googleAuthClient } from '@/lib/server/google-auth';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const settings = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_ANON_KEY }, cache: 'no-store',
    });
    if (!settings.ok) throw new ApiError('Could not check Google sign-in settings. Please try again.', 503);
    const config = await settings.json();
    if (!config.external?.google) throw new ApiError('Google sign-in is not enabled yet. Enable the Google provider in Supabase Authentication.', 503);
    const url = new URL(request.url);
    const origin = `${url.protocol}//${request.headers.get('host') ?? url.host}`;
    const auth = await googleAuthClient();
    const { data, error } = await auth.auth.signInWithOAuth({
      provider: 'google', options: {
        redirectTo: `${origin}/api/auth/google/callback`, skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error || !data.url) throw new ApiError('Could not start Google sign-in. Please try again.', 502);
    return Response.json({ url: data.url }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiError(error); }
}
