# Curated content contract

These JSON records are Astro Content Layer sources. They are validated at build time and are intentionally independent of the legacy Next.js/Supabase TypeScript interfaces.

- `shows/`: a dated live appearance. `available` records require an absolute `ticketUrl`; `sold-out`, `free`, and `demo` records may omit it. `demo` is a visible non-live/TBA state with no ticket link.
- `releases/`: a release with a valid ISO date, one of `single`/`ep`/`album`, optional platform URLs, and an optional static artwork path.
- `links/`: actions for the future `/link` route. `enabled: true` requires a valid external URL (or `/` for the site entry); disabled records intentionally render as pending actions without a dead link.
- `site/site.json`: the single source for artist-level copy and booking details.

`priority` is ascending. Ties are resolved by filename through `src/lib/content.ts`, so visible ordering stays deterministic. Cinematic Hero frames remain versioned static assets outside this directory.

The initial Task 5.2 records are user-approved visual demo content migrated from the former Vercel mock catalog. They deliberately contain no ticket or streaming destinations and must be replaced with approved editorial data before publication.
