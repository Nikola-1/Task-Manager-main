import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config';

const verifierCookie = 'helptask-google-verifier';
const storageKey = 'helptask-google';

export async function googleAuthClient() {
  const jar = await cookies();
  const temporary = new Map<string, string>();
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      flowType: 'pkce', storageKey, persistSession: true,
      autoRefreshToken: false, detectSessionInUrl: false,
      // Only the short-lived PKCE verifier survives the redirect. Supabase
      // access/refresh tokens stay on the server and are never persisted.
      storage: {
        getItem: key => key === `${storageKey}-code-verifier`
          ? jar.get(verifierCookie)?.value ?? null : temporary.get(key) ?? null,
        setItem: (key, value) => {
          if (key === `${storageKey}-code-verifier`) jar.set(verifierCookie, value, {
            httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/api/auth/google', maxAge: 600,
          });
          else temporary.set(key, value);
        },
        removeItem: key => {
          if (key === `${storageKey}-code-verifier`) jar.set(verifierCookie, '', {
            httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/api/auth/google', maxAge: 0,
          });
          else temporary.delete(key);
        },
      },
    },
  });
}
