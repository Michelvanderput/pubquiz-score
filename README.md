# Pubquiz Score

Webapp om een pubquiz te draaien: teams maken, vragen invoeren, punten geven en een live
scorebord tonen. Zelfde stack als de beerpong-app: Nuxt 4, Nuxt UI en Supabase.

## Hoe het werkt

1. **Quiz aanmaken** op de homepage: naam, aantal rondes (standaard 6) en een 4-cijferige quizcode.
2. **Teams** (tabblad Teams): voeg eerst alle spelers toe en selecteer dan wie samen een team
   vormt. Een team heeft minimaal 3 en maximaal 4 spelers.
3. **Punten** (tabblad Punten): per ronde voer je de vragen in. Per vraag tik je op het team of de
   teams die het goed hebben; dat team krijgt de punten van die vraag (standaard 1, instelbaar).
   Tik nogmaals om een punt terug te nemen.
4. **Ronde afronden**: pas dan telt de ronde mee in het scorebord. Punten uit de lopende ronde
   zijn al wel live zichtbaar als "+N live".
5. **Scorebord** (`/scorebord/[id]`): alle teams naast elkaar met plek, totaal en punten per ronde.
   Ververst elke 3 seconden. Gasten openen het via de kijk-link of door de quizcode op de homepage in te vullen.

Kijkers zien de vraagteksten niet (alleen de organisator), het admin-token wordt alleen aan de
organisator teruggegeven.

## Setup

```bash
npm install          # met npm 11 (npm 10 crasht op de Nuxt-peerdeps)
cp .env.example .env # vul SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY in
```

Draai [`supabase/schema.sql`](./supabase/schema.sql) in de Supabase SQL-editor, dan:

```bash
npm run dev
```

## Ontwikkelen

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

- `shared/utils/quiz.ts`: standberekening (afgerond versus live, gedeelde plekken) en teamgrootte-regels.
- `server/api/quizzes/`: API-routes (token-gebaseerde toegang: `admin_token` en `view_token`).
- `app/pages/beheer/[id].vue`: organisator. `app/pages/scorebord/[id].vue`: scorebord.

## Opties

De organisator zet deze per quiz aan of uit (bij het aanmaken of later onder het tabblad Opties):

- **Meerdere teams per vraag** (standaard aan): alle teams met het goede antwoord krijgen het punt. Uit: één winnend team per vraag, een nieuw team vervangt het vorige.
- **Vragen tonen op het scorebord** (standaard uit): het scorebord toont de vragen van de lopende ronde.
- **Tussenstand na elke ronde** (standaard aan): na "Ronde afronden" opent eerst de stand.

Draai je al een database? Voer dan [`supabase/migration_instellingen.sql`](./supabase/migration_instellingen.sql) uit.
