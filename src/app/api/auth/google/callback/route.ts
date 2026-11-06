import { googleAuthClient } from '@/lib/server/google-auth';
import { createSession, database } from '@/lib/server/user-data';

export const runtime = 'nodejs';

function redirect(location: string) {
  return new Response(null, { status: 303, headers: { Location: location, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    if (params.has('error')) return redirect('/?auth_error=google_cancelled');
    const code = params.get('code');
    if (!code || code.length > 4096) return redirect('/?auth_error=google_failed');
    const auth = await googleAuthClient();
    const { data, error } = await auth.auth.exchangeCodeForSession(code);
    if (error || !data.session) return redirect('/?auth_error=google_failed');
    // Revalidate identity with Auth rather than trusting client profile data.
    const verified = await auth.auth.getUser(data.session.access_token);
    const user = verified.data.user;
    if (verified.error || !user?.email_confirmed_at || !user.identities?.some(identity => identity.provider === 'google')) {
      return redirect('/?auth_error=google_failed');
    }
    const profile = await database().rpc('sign_in_google_user', { p_auth_user_id: user.id });
    if (profile.error) {
      if (profile.error.message.includes('EXISTING_EMAIL')) return redirect('/?auth_error=google_existing_email');
      if (profile.error.code === 'PGRST202') return redirect('/?auth_error=google_setup');
      console.error('Google profile setup failed:', profile.error.code);
      return redirect('/?auth_error=google_failed');
    }
    if (!Number.isSafeInteger(profile.data?.id) || profile.data.id <= 0) return redirect('/?auth_error=google_failed');
    await createSession(profile.data.id);
    return redirect('/pages/Task');
  } catch {
    return redirect('/?auth_error=google_failed');
  }
}
