# School Lost & Found

A private, phone-first web app for parents at one school to report lost and
found items and see possible matches. See [docs/BRIEFING.md](docs/BRIEFING.md)
for the product spec and plan.

## Develop

```bash
npm install
npx supabase start   # local database, sign-in and storage (needs Docker)
npm run dev          # http://localhost:3000 — uses .env.local
```

The first visit to `/setup` creates the school's coordinator account.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
npm test             # unit tests (matching rules)
npm run test:e2e     # Playwright, iPhone-sized viewport (resets the local Supabase)
npm run test:db      # database access rules (needs local Postgres, see below)
npm run matching:examples  # example suggestions in plain English
```

## Matching

Possible matches are scored by transparent rules in `src/lib/matching/`.
All weights and thresholds are in `weights.ts`.

## Hosting

Vercel (recommended): [docs/PUT-ONLINE-VERCEL.md](docs/PUT-ONLINE-VERCEL.md). AWS Amplify alternative: [docs/PUT-ONLINE-AWS.md](docs/PUT-ONLINE-AWS.md).

## Database

Schema, access rules (RLS) and storage policies live in
`supabase/migrations/`. `npm run test:db` applies them to a throwaway
database on a local Postgres (`DATABASE_URL`, default
`postgres://postgres:postgres@localhost:5432/postgres`) together with
`supabase/tests/supabase-stub.sql`, a minimal stand-in for Supabase's `auth`
and `storage` schemas, and checks who can read and change what.

Deployments run `scripts/migrate.mjs` before building, which applies any new
files in `supabase/migrations/` to the hosted database (using
`POSTGRES_URL_NON_POOLING`, set by the Vercel ↔ Supabase integration).

## Sign-in

Email + password. Accounts are created by the server (already confirmed), so
the app sends no emails at all. Parents join through an invite link and are
approved by the coordinator, who can also issue a temporary password.

## Guides

- Coordinator guide (plain English): [docs/COORDINATOR-GUIDE.md](docs/COORDINATOR-GUIDE.md)
- Product brief and progress: [docs/BRIEFING.md](docs/BRIEFING.md)
