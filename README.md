# School Lost & Found

A private, phone-first web app for parents at one school to report lost and
found items and see possible matches. See [docs/BRIEFING.md](docs/BRIEFING.md)
for the product spec and plan.

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
```

## Checks

```bash
npm run lint
npm run typecheck
npm run build
npm test             # unit tests (matching rules)
npm run test:e2e     # Playwright, iPhone-sized viewport
npm run test:db      # database access rules (needs local Postgres, see below)
npm run matching:examples  # example suggestions in plain English
```

## Matching

Possible matches are scored by transparent rules in `src/lib/matching/`.
All weights and thresholds are in `weights.ts`.

## Hosting

See [docs/PUT-ONLINE-AWS.md](docs/PUT-ONLINE-AWS.md).

## Database

Schema, access rules (RLS) and storage policies live in
`supabase/migrations/`. `npm run test:db` applies them to a throwaway
database on a local Postgres (`DATABASE_URL`, default
`postgres://postgres:postgres@localhost:5432/postgres`) together with
`supabase/tests/supabase-stub.sql`, a minimal stand-in for Supabase's `auth`
and `storage` schemas, and checks who can read and change what.
