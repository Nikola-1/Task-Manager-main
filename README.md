# Task Manager

Next.js aplikacija za zadatke, grupe, kalendar, navike i Pomodoro, uz Supabase bazu i demonstracioni chat.

## Pokretanje

```sh
npm install
npm run dev
```

Aplikacija je dostupna na http://localhost:3000.

```sh
npm run check:imports
npm run typecheck
npm run lint
npm run build
npm start
```

Build koristi postojeće Google fontove i zahteva mrežni pristup. Postojeće preskakanje TypeScript grešaka pri build-u ostaje uključeno; `typecheck` ih proverava nezavisno.

Za slanje email poruka postavi `EMAIL_USER` i `EMAIL_PASS` u `.env.local`. Konfiguracija postojeće Supabase baze je u `src/lib/supabase/client.ts`.

Organizacija foldera, odgovornosti modula, granice reorganizacije i poznata ograničenja opisani su u [ARCHITECTURE.md](ARCHITECTURE.md).

## Chat

Sekcija `/pages/Chat` koristi `Friends` i javna polja profila iz `Users` za listu prijatelja, pretragu, zahteve i prihvatanje prijateljstva. Prijatelji se prikazuju jednom, bez simuliranog online statusa.

Razgovori su trenutno lokalni prikaz: poruke se cuvaju u `localStorage`, zasebno za svaki par korisnik/prijatelj, i ne dostavljaju se drugom korisniku. Enter cuva poruku, Shift+Enter pravi novi red. Za stvarno slanje potrebno je povezati potvrdenu tabelu poruka i autentifikovan pristup bazi; sada aplikacija koristi svoj `Users` login.

Provera lokalnog chata i pristupa profilima:

```sh
node scripts/test-chat.cjs
```
