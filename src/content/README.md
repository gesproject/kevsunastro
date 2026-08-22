# Curated content contract

These JSON records are Astro Content Layer sources. They are validated at build time and are intentionally independent of the legacy Next.js/Supabase TypeScript interfaces.

- `shows/`: a dated live appearance. `available` records require an absolute `ticketUrl`; `sold-out` and `free` records may omit it.
- `releases/`: a release with a valid ISO date, one of `single`/`ep`/`album`, optional platform URLs, and an optional static artwork path.
- `links/`: actions for the future `/link` route. `enabled: true` requires a valid external URL (or `/` for the site entry); disabled records intentionally render as pending actions without a dead link.
- `site/site.json`: the single source for artist-level copy and booking details.

`priority` is ascending. Ties are resolved by filename through `src/lib/content.ts`, so visible ordering stays deterministic. Cinematic Hero frames remain versioned static assets outside this directory.

No shows or releases are seeded here: Task 5.2 will add verified editorial records instead of copying legacy mock/placeholder data.
