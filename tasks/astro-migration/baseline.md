# Task 0.1 — Recoverable baseline

**Captured:** 2026-07-22
**Scope:** evidence only; no application, deployment, database, configuration, or lockfile change.

## Repository and rollback state

- **Branch / commit:** `main` at `200e948e705a9da7883cdc8db45080ffd2e8a711` (`docs: mark Tasks 3-6 complete — Supabase live in Montreal, wired to Vercel`; 2026-07-04T18:33:32-04:00).
- **Working tree at capture:** pre-existing untracked `.agents/` and `tasks/astro-migration/`; no tracked-file changes observed before this record.
- **Rollback owner:** migration coordinator, with human approval required for infrastructure actions.
- **Rollback status:** ready. The current Next.js `main` deployment remains the rollback path; no Vercel or Supabase action was taken in this task.

## Public deployment discovery

- **Production candidate:** `https://solbo.vercel.app` returned `HTTP 200` from Vercel on a public `HEAD` request. Its 25,520-byte public HTML response contained neither `shows`/`releases` labels nor the known local seed-content tokens, so it proves Vercel reachability but not that it is the current Next.js deployment.
- **Preview:** the historical documentation placeholder `https://solbo-xxxxxxx.vercel.app` returned `HTTP 404 DEPLOYMENT_NOT_FOUND`; no live preview URL is recorded locally.
- Public requests to `https://solbo.vercel.app/api/shows` and `/api/releases` both returned `HTTP 404`, so they cannot be used as a public content-export source.

## Runtime and dependency snapshot

| Item | Exact resolved version |
| --- | --- |
| Node.js | `v20.20.2` |
| npm | `10.8.2` |
| Next.js | `16.2.2` |
| React / React DOM | `19.2.4` / `19.2.4` |
| TypeScript | `5.9.3` |
| Supabase JS | `2.101.1` |
| GSAP / Lenis | `3.14.2` / `1.3.21` |
| Motion | `12.38.0` |
| Tailwind CSS | `4.2.2` |
| Paper shaders React | `0.0.72` |
| Three / React Three Fiber | `0.183.2` / `9.5.0` |

`npm ls --depth=0` also reported pre-existing extraneous packages in `node_modules`; no install, prune, or lockfile change was made.

## Environment names only

No values were read into this record.

| File | Variable names |
| --- | --- |
| `.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_DB_PASSWORD` |
| `.env.local.example` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |

## Current API contract

The current build declares dynamic API routes at `/api/shows` and `/api/releases`. In the repository they query Supabase when a server client is configured and otherwise return the local mock arrays.

- `GET /api/shows` returns `Show[]`, sorted by `date` ascending: `{ id, date, venue, city, country, ticketUrl?, isSoldOut?, isFree? }`.
- `GET /api/releases` returns `Release[]`, sorted by `releaseDate` descending: `{ id, title, releaseDate, type, artworkUrl?, spotifyUrl?, soundcloudUrl?, bandcampUrl?, youtubeUrl? }`, where `type` is `single`, `ep`, or `album`.
- The database-to-API mappings use snake_case database columns (`ticket_url`, `is_sold_out`, `is_free`, `release_date`, and the `*_url` fields) and omit `null` optional values from the JSON shape.

## Human-approved no-data-migration waiver

**Decision (2026-07-22):** No Supabase shows/releases export or migration is required. The human has approved rebuilding content in a small CMS, so legacy Supabase records are not migration input for this work.

Keystatic remains a candidate, not a final decision. Task 1.4 / Gate A must select and prove the approved small CMS and host before production content implementation. This waiver does not authorize Vercel/Supabase deletion, database changes, credential use, or any early infrastructure retirement.

## Production build evidence

Command: `npm run build`
Result: exit `0` in `43.5s`; no errors or warnings emitted.

```text
> solbo@0.1.0 build
> next build

▲ Next.js 16.2.2 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 18.4s
  Running TypeScript ...
  Finished TypeScript in 15.6s ...
  Collecting page data using 3 workers ...
  Generating static pages using 3 workers (0/6) ...
✓ Generating static pages using 3 workers (6/6) in 995ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/releases
└ ƒ /api/shows

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

## Ponytail / scope review

The Ponytail review skill is not exposed in this environment, so the codex-loop manual YAGNI ladder was applied:

1. The approved no-data-migration decision and its direct forward-plan corrections are required by Task 0.1.
2. Markdown and the existing task system suffice.
3. No dependency or service is needed.
4. Updating this record plus the two directly affected plan tasks is smaller and safer than source/configuration changes.
5. No change beyond those task-system documents was added.

Vercel and Supabase were not modified, queried with privileged credentials, deployed, or otherwise changed.
