# Task List — Production Migration + Supabase CMS

## Phase 0 - Gemini Design Polish
- [x] Task 0.1: Run Gemini hero social-logo prompt (`tasks/prompts/01-gemini-hero-social-logos.md`)
- [x] Task 0.2: Run Gemini music-player prompt (`tasks/prompts/02-gemini-music-players.md`)

## Checkpoint 0: Design polish reviewed on mobile and desktop

## Phase 1 — Vercel + Custom Domain
- [x] Task 1: Create client Vercel account, connect GitHub, deploy site
- [ ] Task 2: Connect custom domain, configure DNS (deferred until final client domain/account cutover)

## ✓ Checkpoint 1: Site live at custom domain

## Phase 2 — Supabase Schema + Seed
- [x] Task 3: Created Supabase project "solbo" (ref `caizqueakpductfbzpga`) in ca-central-1 (Montréal), under the developer's account for now — transfer to client's account once his account exists. Schema + RLS + `release-artwork` public bucket applied via `supabase db push`.
- [x] Task 4: Seeded via `supabase/migrations/20260704193401_seed.sql` — verified 5 shows, 3 releases via REST API

## ✓ Checkpoint 2: DB live with seeded data — DONE (2026-07-04)

## Phase 3 — Wire Up the Frontend
- [x] Task 5: Supabase server client implemented (`lib/supabase-server.ts`); real env vars added to Vercel production (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) and redeployed
- [x] Task 6: API routes — /api/shows and /api/releases, confirmed serving real Supabase rows on production (not mock fallback)
- [x] Task 7: Shows.tsx and Music.tsx fetch from API routes client-side, fall back to mock data only if the API call fails
- [x] Task 8: Spotify + SoundCloud iframe embeds with URL conversion, `loading="lazy"`; placeholder URLs still pending real client URLs

## ✓ Checkpoint 3: Site fully live — real data confirmed live on production; embeds still on placeholder URLs; account ownership still under developer's Vercel/Supabase accounts pending client account creation
Remaining blocker: awaiting client's own Vercel/Supabase accounts (needs his email confirmed) to transfer ownership, plus real Spotify/SoundCloud/ticket/social URLs from the client.

## Phase 4 - Optimization & Handoff
- [x] Task 9: Ran code-review audit (Ponytail equivalent) on Phase 3 diff; applied 2 safe fixes — Supabase error logging, shared `useFetchWithFallback` hook. Build/lint clean.
- [x] Task 10: Wrote `docs/client-guide.md` — covers credentials needed, login, editing shows/releases, artwork upload, Spotify/SoundCloud links, social/booking link locations, previewing, pre-publish checklist, and support contacts
- [ ] Task 11: Final production QA checklist

## Checkpoint 4: Optimization, client guide, and final QA complete
