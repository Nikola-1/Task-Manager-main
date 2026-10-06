# Organizacija projekta

Projekat koristi Next.js App Router. Refaktorisanje zadržava postojeće URL-ove,
izgled, stanje prijave i upite prema postojećoj Supabase bazi.

```text
src/
  app/                     # Next.js rute, root layout, globalni CSS i HTTP endpoint-i
    pages/                 # postojeći /pages/* URL-ovi; tanki izvozi prikaza
    api/send-email/         # postojeći serverski email endpoint
  features/
    account/               # prikaz i podešavanja naloga
    auth/                  # prijava, verifikacija, promena lozinke i AuthContext
    tasks/                 # zadaci, editor, liste, filteri i hook-ovi
    groups/                # grupe, članstvo i ScopeContext
    tags/                  # tagovi i njihov modal
    calendar/              # kalendar i izbor datuma
    habits/                # prikaz navika
    chat/                  # prijatelji i demonstracioni chat
    pomodoro/              # tajmer i njegovi stilovi
  components/
    layout/                # zajednička navigacija
    ui/                    # zajednički meniji, izbor stikera i UI hook-ovi
  lib/supabase/            # postojeći Supabase klijent i zajednički upiti za stikere
  types/                   # zajednički UserType, TaskType i GroupType
  experiments/             # implementacije postojećih animation* stranica
  assets/img/              # statički uvezene slike
public/img/                # slike dostupne preko postojećih /img/* URL-ova
```

Funkcionalnost može imati `components`, `hooks`, `context`, `pages` i `data`
foldere kada su potrebni. `pages` unutar funkcionalnosti sadrži implementaciju
prikaza, a `app/pages` definiše javne Next.js rute. Eksperimentalne rute su
zadržane radi kompatibilnosti, dok je njihov kod izdvojen u `experiments`.

Lokalni importi koriste alias `@/` koji označava `src/`. Komponente i stilovi
ostaju zajedno. Tailwind pretražuje ceo `src` da preseljenje ne izgubi klase.

Operacije nekadašnjeg `app/api/supabase.ts` podeljene su na `*.repository.ts`
module po oblasti, bez promene njihovih upita i rezultata. `saveContent` sada
prima HTML string; pretvaranje Tiptap editora u HTML ostaje u komponenti.
Preostali direktni upiti u komponentama zadržani su u ovom refaktorisanju.

## Pokretanje i provere

- `npm install`: instalacija zavisnosti iz postojećeg projekta.
- `npm run dev`: razvojni server.
- `npm run build`: produkcijski build; postojeći Google fontovi zahtevaju mrežni pristup.
- `npm start`: pokretanje produkcijskog servera posle build-a.
- `npm run check:imports`: proverava sve lokalne importe i izvoze.
- `npm run typecheck`: TypeScript provera bez generisanja fajlova.
- `npm run lint`: direktno pokreće ESLint.

Za email endpoint potrebni su `EMAIL_USER` i `EMAIL_PASS` u `.env.local`.
Postojeća konfiguracija Supabase klijenta nalazi se u `src/lib/supabase/client.ts`.
Šema baze i RLS politike nisu dostupne u ovom repozitorijumu; nisu rekonstruisane
iz pretpostavki niti je menjana udaljena baza.

## Granice ovog refaktorisanja

Autentifikacija preko lokalnog korisničkog objekta, verifikacioni kodovi,
postojeći filteri, demonstracioni podaci i navigaciona logika ostaju isti.
Ovo nije migracija na Supabase Auth niti promena ponašanja aplikacije.

`typescript.ignoreBuildErrors` ostaje uključen zbog postojećih grešaka tipova.
Uspešan build zato ne znači da `npm run typecheck` prolazi. Zaseban posao treba
da uskladi tipove podataka i props-e, autentifikaciju i pravila autorizacije.
