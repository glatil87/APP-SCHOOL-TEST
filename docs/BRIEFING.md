# School Lost & Found — Version 1 Briefing

Status: **Draft for approval.** No application code has been written yet.

## 1. Current project

The repository is empty (no commits, no files). There is no existing framework,
package manager config, database or auth setup. Everything below is a proposal.

The development container has Node 22, npm/pnpm, Docker and `psql`, so a local
database can be run for testing access rules.

## 2. Proposed stack

| Concern | Choice | Why |
| --- | --- | --- |
| Web app | **Next.js (App Router) + TypeScript** | Mature, mobile-friendly responsive web app, server-side rendering keeps data off public pages. |
| Styling | **Tailwind CSS** with a small set of design tokens | Easy to keep the calm, Apple-inspired look consistent (system font stack, rounded cards, restrained palette, dark mode). |
| Database | **Supabase Postgres** | Row Level Security (RLS) lets the database itself enforce "only approved members of this school can read or change data". |
| Sign-in | **Supabase Auth, email magic link** (one-time sign-in link) | No passwords to manage; the only emails sent are sign-in emails. |
| Photos | **Supabase Storage**, private bucket, per-school folder, signed URLs | Photos are never publicly reachable. |
| Tests | **Vitest** (matching logic, validation), **SQL tests** for RLS, **Playwright** (core flows on a phone-sized viewport) | |
| Hosting | **Vercel** (or any Node host) | Free tier is fine for a one-school pilot. |

## 3. Product spec (v1)

A private, phone-first web app for parents at one school to:

- report an item their child has **lost** ("missing") or an item they have **found**;
- browse current Missing and Found lists with search and filters;
- see **possible matches** between missing and found reports, ranked with a short, plain-English explanation;
- open a missing and a found report side by side and **confirm** "This looks like a match" or **dismiss** the suggestion;
- see confirmed matches involving their reports and mark the item **Returned**.

Principles:

- Matches are only ever *suggestions*. Wording never says "this is your item" or implies certainty.
- Nothing is marked matched or returned automatically; a parent always acts.
- Friendly and fast: a report should take under a minute on a phone.
- No emails, messages or notifications other than the sign-in link.

Out of scope for v1: payments, chat, push notifications, multiple schools, AI
image recognition, automatic matching or returning.

## 4. Privacy and access

- **No child data.** The only child detail collected is the child's first name, used in the parent's display name (e.g. "Sam (Mia's parent)"). No date of birth, class or photos of children.
- **Photo guidance.** Above the photo picker: "Photograph the item only — please don't include children in the photo." Uploads are resized and EXIF/location metadata is stripped before storage.
- **Members only.** Every page except sign-in and the invite landing page requires a signed-in, *approved* member of the school. There are no public report URLs.
- **Database-enforced access.** RLS policies on every table: a user can only read rows for a school where they have an `approved` membership, and can only create/edit their own reports. Storage policies mirror this for photos.
- **Minimal parent data.** We store the parent's email (for sign-in), their first name, their child's first name, an avatar or picture, and an optional phone number. Other members see the name and avatar; contact details are only shown to the other parent on a confirmed match.
- **Deletion.** A parent can delete their own report (and its photo). Reports marked Returned are hidden from the main lists.

## 5. Data model (proposed)

```
schools
  id, name, created_at

profiles                      -- one per signed-in user
  user_id (→ auth.users), parent_first_name, child_first_name,
  avatar (built-in id or picture path), phone (optional), created_at

memberships                   -- who belongs to the school, and whether approved
  id, school_id, user_id, role ('parent' | 'coordinator'),
  status ('pending' | 'approved' | 'removed'), created_at, approved_by, approved_at

invites                       -- how people join (link + approval)
  id, school_id, code_hash, label, expires_at, max_uses, use_count,
  created_by, created_at, revoked_at

reports
  id, school_id, reporter_id,
  kind ('missing' | 'found'),
  status ('open' | 'matched' | 'returned' | 'withdrawn'),
  -- open reports older than 2 months are shown under "Older reports"
  item_name, category, colour, brand (nullable), size (nullable),
  details, location, event_date (date last seen / found),
  current_location (found only, e.g. "Handed in to school office", optional),
  photo_path (nullable), created_at, updated_at

contact_details               -- private; only shared via match_contacts() on a confirmed match
  user_id, phone

match_decisions               -- a parent's action on a missing/found pair
  id, school_id, missing_report_id, found_report_id,
  status ('confirmed' | 'dismissed' | 'returned'),
  score_at_decision, decided_by, decided_at, returned_by, returned_at
  UNIQUE (missing_report_id, found_report_id)
```

Notes:

- `category` is a fixed list: Clothing, Uniform, Shoes, Bags, Water bottles,
  Lunch boxes, Sports kit, Books & stationery, Electronics, Glasses, Toys, Other.
- `colour` is a fixed list with an "Other / multi" option, which makes matching reliable.
- **Possible matches are computed, not stored.** Only decisions (confirm/dismiss/returned) are saved. Dismissed pairs are hidden from suggestions.
- Report status is updated from the decision: confirming sets both reports to `matched`; marking Returned sets both to `returned` (in one database function so they stay consistent).

## 6. Matching (rules-based, adjustable)

Lives in its own module, `src/lib/matching/`, with no UI or database code:

- `weights.ts` — all weights and thresholds in one editable config.
- `normalise.ts` — lower-casing, stop words, colour synonyms (navy → blue), size normalisation ("age 7-8", "7-8y").
- `score.ts` — `scoreMatch(missing, found) → { score 0–100, band, reasons[] }`.

Signals (starting weights, all tunable):

| Signal | Rule | Weight |
| --- | --- | --- |
| Category | Same category (different category → not suggested) | gate + 20 |
| Name & details | Word overlap between item name + details | up to 30 |
| Colour | Same colour 15; related colour (e.g. navy/blue) 8 | up to 15 |
| Brand | Both given and same 15; one missing → 0; both given and different → −10 | up to 15 |
| Size | Both given and same 10; different → −10 | up to 10 |
| Location | Same location / word overlap | up to 10 |
| Date | Found on or after the day it went missing (with 2-day grace) and within 30 days | up to 5; found well before lost → −15 |

Output:

- Only suggestions scoring ≥ 35 are shown; top 5 per report, highest first.
- Bands: **"Worth a look"** (35–59) and **"Several details match"** (60+). Never "certain", "confirmed" or percentages that read as probability.
- Each suggestion lists 1–4 reasons, e.g. "Same category: Water bottles · Both blue · Both mention 'dinosaur sticker' · Found 2 days after it went missing".

## 7. Screens

1. **Sign in** — email field → "Check your email for a sign-in link".
2. **Join school** (invite link landing) — enter your first name, your child's first name, optional phone, pick an avatar → "Waiting for approval".
3. **Home** — two large buttons, "Report a missing item" / "Report a found item"; below, "Your reports" with any possible or confirmed matches highlighted.
4. **Report form** (missing / found variant) — fields from the brief, inline validation, photo picker with warning, submit → confirmation screen ("Report added. We'll show possible matches on your report.").
5. **Missing list** and **Found list** — tab switcher, search box, filters (category, status), cards with photo thumbnail, colour dot, location and date.
6. **Report detail** — full details, photo, owner actions (edit, withdraw), and the **Possible matches** section.
7. **Compare** — missing and found reports side by side (stacked on phone) with matching fields highlighted, reasons, and buttons "This looks like a match" / "Not a match".
8. **Confirmed match** — shows both reports, who reported each (display name), where the found item is now, and "Mark as returned".
9. **Coordinator page** (minimal) — approve/remove members, create/revoke invite link.
10. Shared states — loading skeletons, empty states ("No missing items right now 🎉"), error and offline messages, toast confirmations.

## 8. Acceptance criteria — core flows

**Reporting a missing item**
- Given I am an approved member, when I tap "Report a missing item", I see a form with item name, category, colour, brand (optional), size (optional), distinguishing details, location last seen, date last seen, and optional photo.
- Submitting with item name, category, colour, location or date missing shows a clear message next to each missing field and does not submit.
- Date cannot be in the future.
- The photo area says not to include children; images over 10 MB or non-image files are rejected with a message.
- On success I see a confirmation, and the report appears at the top of the Missing list and under "Your reports".
- Another member of the school can see it; someone signed out or not approved cannot, even by guessing the URL or calling the database directly.

**Reporting a found item**
- Same as above with "found" wording, plus "Where is the item now?" (e.g. handed to office / I have it).
- It appears in the Found list and under "Your reports".

**Seeing a possible match**
- When a missing and a found report share a category and score ≥ 35, each report's detail page shows the other under "Possible matches".
- Suggestions are ranked highest score first, show at most 5, and each shows a band label and 1–4 reasons.
- No wording claims certainty. Dismissed pairs, withdrawn reports and returned reports are not suggested.
- If there are none, a friendly empty state explains we'll keep checking as new reports come in.

**Confirming a match**
- From a suggestion I can open the Compare screen showing both reports.
- Only the parent who made either report (or a coordinator) sees "This looks like a match" and "Not a match".
- Confirming asks for a second tap ("Confirm this match?"), then both reports show "Matched" and a confirmed-match card visible to both reporting parents.
- Dismissing hides that suggestion for everyone and cannot confirm it by accident; it can be undone from the compare screen.
- Nothing is confirmed automatically.

**Marking returned**
- On a confirmed match, either reporting parent (or a coordinator) can tap "Mark as returned", with a confirmation step.
- Both reports then show "Returned", disappear from the default Missing/Found lists (visible with the "Returned" status filter), and no longer appear in suggestions.

## 9. Implementation plan — bites

Each bite ends with: app running, checks passing, what to try on your phone,
known gaps, and a pause for your feedback.

| Bite | Scope | Checks |
| --- | --- | --- |
| **1. Shell & look** | Next.js + TS + Tailwind scaffold, design tokens, layout, Home screen with the two actions, placeholder lists, empty states. No data yet. | lint, typecheck, build, Playwright smoke at iPhone size |
| **2. Matching engine** | Pure `src/lib/matching` module with weights config and reasons; no UI. | Vitest unit tests with realistic examples (e.g. two blue bottles, different brands) |
| **3. Database & access rules** | SQL migrations for the data model, RLS + storage policies, seed data for local dev. | SQL tests proving non-members and other schools can't read/write |
| **4. Sign-in & joining** | Magic-link sign-in, invite link, pending/approved gate, minimal coordinator page. | Playwright: signed-out user redirected; pending user blocked |
| **5. Reporting** | Missing/found forms, validation, photo upload with warning and metadata stripping, confirmation. | Vitest validation tests, Playwright report flow |
| **6. Lists & detail** | Missing/Found lists, search, category/status filters, report detail, edit/withdraw, loading states. | Playwright list/search/filter |
| **7. Possible matches & compare** | Suggestions on report detail, compare screen, confirm/dismiss. | Playwright confirm/dismiss |
| **8. Confirmed & returned** | Confirmed-match card, mark returned, "Your reports" summary on Home. | Playwright end-to-end: missing → found → match → returned |
| **9. Pilot polish** | Accessibility pass, dark mode check, copy review, deployment guide, coordinator guide. | Lighthouse / axe checks |

## 10. Setup you will need to provide

Not needed for bites 1–2 (they run with no external services). Needed from bite 3/4:

1. **A Supabase project** (free tier is fine): project URL, anon key, and service-role key (the service key stays server-side only). Alternatively I can develop entirely against a local Supabase in Docker and you create the hosted project before the pilot.
2. **Auth email settings**: the Site URL / redirect URL of wherever the app is hosted. For a real pilot, a custom SMTP sender (e.g. Resend/Postmark) is advisable because Supabase's built-in email is rate-limited.
3. **Hosting**: a Vercel (or similar) account connected to this GitHub repo, with the Supabase keys added as environment variables.
4. **School details**: school name and the first coordinator's email address.

## 11. Decisions and open questions

The product owner has asked that all technical decisions be made by the
developer, and that questions to them be in plain English about how the school
and parents work.

Technical decisions taken:

- Stack: Next.js + TypeScript + Tailwind, Supabase (Postgres, magic-link auth, private storage), Vercel hosting.
- Development uses a local database first; hosted accounts are set up later with step-by-step, non-technical instructions.

Product decisions from the product owner (answered in plain English):

1. **Joining:** invite link + approval. On joining, a parent gives their own
   name and their child's name; together these form their name in the app,
   e.g. "Sam (Mia's parent)". Developer decision: child **first name only**,
   no surname, date of birth or class, to keep child data minimal.
2. **Approver:** the product owner approves new parents (coordinator role).
3. **Handing back:** parents arrange it themselves. As soon as a match is
   confirmed, both parents see each other's name and contact details and both
   reports leave the public lists. They stay under "My matches" for the two
   parents until one marks the item returned. Developer decision: contact
   details = sign-in email, plus an optional phone number the parent chooses
   to share.
4. **Names and pictures:** names may be shown. Parents can pick an avatar
   from a built-in set or upload their own picture (with the same "no
   children in photos" reminder).
5. **Child's name in reports:** allowed (e.g. a name label on a jumper).
   Developer decision: the form hint suggests first name or initials rather
   than full name.
6. **Old reports:** after 2 months unresolved, a report moves out of the main
   lists into a separate "Older reports" section. Nothing is deleted
   automatically.
