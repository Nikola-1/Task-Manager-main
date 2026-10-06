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
