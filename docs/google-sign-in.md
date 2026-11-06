# Google prijava

Kod podrzava prijavu i registraciju preko Google-a kroz Supabase Auth i postojecu
HelpTask sesiju. Google sifra, access token i refresh token ne cuvaju se u browseru.
Postojeci login korisnickim imenom ostaje dostupan.

## Aktivacija

1. U Supabase SQL Editor-u pokreni
   `supabase/migrations/20261105_google_sign_in.sql`.
   Serverski `SUPABASE_SERVICE_ROLE_KEY` mora biti postavljen u `.env.local`
   i na hostingu (vec ga koristi postojeci session API).
2. U Google Cloud Console izaberi/napravi projekat i podesi Google Auth Platform:
   Branding, Audience i OAuth klijent tipa **Web application**.
   Ako je aplikacija u Testing rezimu, dodaj Google naloge za testiranje u Test users.
3. Za **Authorized JavaScript origins** dodaj `http://localhost:3000` i produkcijski
   origin, ako postoji.
   Za **Authorized redirect URIs** dodaj tacno:
   `https://opckmcxwoanlozwgrsab.supabase.co/auth/v1/callback`.
4. U Supabase > Authentication > Sign In / Providers > Google ukljuci provider,
   unesi Google **Client ID** i **Client Secret**, pa sacuvaj.
   Secret unesi samo u Supabase, ne u frontend kod niti u chat.
5. U Supabase > Authentication > URL Configuration dodaj u **Redirect URLs**:
   - `http://localhost:3000/api/auth/google/callback`
   - `http://127.0.0.1:3000/api/auth/google/callback`, ako koristis tu adresu
   - `https://TVOJ-DOMEN/api/auth/google/callback`, kada objavis aplikaciju
   Podesi i **Site URL** na adresu aplikacije.

Google callback iz koraka 3 vodi u Supabase; callback iz koraka 5 vraca korisnika
u HelpTask. Oba moraju biti podesena. Koristi isti host na pocetku i kraju prijave,
jer je PKCE verifier vezan za HttpOnly cookie tog hosta.

## Ponasanje i provera

- Klik na Google dugme vodi na izbor Google naloga. Ako provider nije aktivan,
  forma prikazuje objasnjenje.
- Prvi uspesan login pravi `Users` profil i vezu u `google_user_accounts`.
  Sledeci login vraca isti profil, taskove i grupe.
- Ako email vec pripada starom nalogu, Google prijava ne spaja naloge automatski.
  Korisnik dobija poruku da koristi postojeci username/password login.
- Otkazivanje ili neuspesna prijava vraca korisnika na formu sa porukom greske.
- Logout brise HelpTask cookie; Google tokeni nisu sacuvani u browseru.
- Proveri novim Google nalogom: prijava, kreiranje taska, logout, ponovna Google
  prijava, isti task. Proveri i otkazivanje Google autorizacije.

Serverski kod koristi PKCE i proverava identitet pozivom `auth.getUser`.
RPC za povezivanje profila dostupan je samo `service_role` ulozi. Migracija i
provider podesavanja moraju biti aktivirani pre stvarnog end-to-end testa.

Dokumentacija: [Google provider](https://supabase.com/docs/guides/auth/social-login/auth-google),
[PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow).
