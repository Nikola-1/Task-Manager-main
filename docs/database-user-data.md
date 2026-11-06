# Poruke, prioriteti i navike

1. Pokreni obe SQL skripte redom u Supabase SQL Editor-u:
   - `supabase/migrations/20261104_messages_priorities_habits.sql`
   - `supabase/migrations/20261104_user_data_server_access.sql`
   Ako si prvu skriptu vec pokrenuo, pokreni samo drugu.
2. U `.env.local` dodaj `SUPABASE_SERVICE_ROLE_KEY=<service_role kljuc tvog Supabase projekta>`.
   Koristi isti projekat kao u `src/lib/supabase/client.ts`.
   Ako menjas projekat, postavi i `SUPABASE_URL` na serveru i azuriraj browser klijent.
   Kljuc se koristi iskljucivo na serveru. Ne koristi `NEXT_PUBLIC_` prefiks.
3. Restartuj razvojni server i ponovo se prijavi. Na hostingu dodaj istu promenljivu.

Prijava proverava postojece kredencijale u `Users` tabeli i postavlja potpisan
HttpOnly kolacic koji vazi sedam dana. API odredjuje korisnika iz kolacica,
proverava vlasnistvo navika i pristup taskovima i dozvoljava slanje samo prihvacenim
prijateljima. Novi podaci idu kroz `/api/user-data`; browser nema direktan pristup
novim tabelama. Ovo ne menja pristup starim tabelama u ostatku aplikacije.

Razgovor proverava nove poruke svakih pet sekundi dok je otvoren. Starije poruke
se ucitavaju dugmetom. Navike i prioriteti se osvezavaju pri povratku na prozor.

Stari lokalni podaci ostaju u localStorage-u, ali se vise ne koriste za ove funkcije.
Nema automatskog prenosa: stare chat poruke su bile lokalni pregled i ne treba ih
naknadno slati prijateljima bez posebnog izbora korisnika.

Provera sa dva naloga: prihvati prijateljstvo, posalji poruku i proveri drugi nalog;
promeni prioritet i osvezi stranicu; dodaj naviku, oznaci dan, osvezi, izmeni i obrisi.
Bez prijave API vraca 401. Tudja navika i task bez dodele ne mogu se menjati.

`npm run test:user-data` proverava sesije, kontrolu pristupa, validaciju i ponovni
pokusaj slanja poruke uz simuliran transport baze. Za stvarnu proveru cuvanja
potrebni su pokrenute migracije i ispravan serverski kljuc.
