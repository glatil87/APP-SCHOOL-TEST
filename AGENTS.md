# Project notes

- Next.js is pinned to **15.x** on purpose: AWS Amplify Hosting (where the pilot
  is deployed) supports server-rendered Next.js only up to version 15. Don't
  upgrade to 16 until Amplify supports it.
- Product spec and plan: `docs/BRIEFING.md`. Work proceeds in small "bites";
  the product owner is non-technical, so explain changes in plain English.
- Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:db`,
  `npm run test:e2e`.
