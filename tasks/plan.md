# Production Migration Plan — Sölbo Website

**Date:** 2026-05-12
**Stack:** Next.js · Supabase · Vercel · TypeScript

---

## What We're Building

A fully live artist website with:
- Hosting on the client's Vercel account, connected to GitHub, with a custom domain
- Supabase backend (Montréal) for shows and releases data — client manages content directly via Supabase Studio (no custom admin panel)
- Spotify + SoundCloud embed players on the frontend (public iframes, no credentials needed)

---

## Architecture Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Content management | Supabase Studio (built-in) | No admin panel to build or maintain |
| Public reads | Supabase `anon` key via API route | Shows/releases are public data |
| Writes | Client edits rows directly in Supabase Studio | Simple, zero extra code |
| Media embeds | Public `<iframe>` (Spotify + SoundCloud) | No API credentials required |
| Artwork storage | Supabase Storage, public bucket | Client uploads via Storage browser in Studio |
| Supabase region | `ca-central-1` (Montréal) | Closest to client and audience |

---

## Dependency Graph

```
Vercel account → GitHub integration → custom domain
    │
    └── Supabase project (Montréal)
            ├── shows table + RLS
            ├── releases table + RLS
            └── Storage bucket: release-artwork (public)
                    │
                    └── Next.js API layer
                            ├── lib/supabase-server.ts  (service_role — server only)
                            ├── GET /api/shows
                            ├── GET /api/releases
                            └── public sections fetch live data
                                    └── Spotify + SoundCloud embeds
```

---

## Phase 1 — Vercel Account + Site Live

### Task 1: Create client Vercel account and deploy site

**Steps:**
1. Go to `vercel.com` → sign up with client's email
2. Import GitHub repo → project name: `solbo` (or `kev-sun`)
3. Vercel → Settings → Environment Variables, add these three (placeholder values for now — update after Phase 2):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy → confirm production URL loads all 4 sections

**Acceptance criteria:**
- [ ] Vercel account exists under client email
- [ ] Push to `main` triggers auto-deploy
- [ ] Production URL loads, no console errors

---

### Task 2: Connect custom domain

**Steps:**
1. Vercel → Project → Settings → Domains → add client's domain
2. Copy DNS records Vercel provides (A record or CNAME)
3. Add records in client's DNS registrar
4. Confirm propagation (usually <1h, up to 48h)

**Acceptance criteria:**
- [ ] `https://[client-domain]` loads with valid SSL
- [ ] Vercel shows "Valid Configuration"

---

### ✓ Checkpoint 1: Site live at custom domain

---

## Phase 2 — Supabase Schema + Seed

### Task 3: Create Supabase project, tables, and storage

**Steps:**
1. `supabase.com` → New project → region: `ca-central-1 (Montréal)`
2. SQL editor → run:

```sql
create table shows (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  venue text not null,
  city text not null,
  country char(2) not null,
  ticket_url text,
  is_sold_out boolean default false,
  is_free boolean default false,
  created_at timestamptz default now()
);

create table releases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  release_date date not null,
  type text check (type in ('single','ep','album')) not null,
  artwork_url text,
  spotify_url text,
  soundcloud_url text,
  bandcamp_url text,
  youtube_url text,
  created_at timestamptz default now()
);

alter table shows enable row level security;
alter table releases enable row level security;

create policy "public read shows" on shows for select using (true);
create policy "public read releases" on releases for select using (true);
```

3. Storage → New bucket → name: `release-artwork` → set to **Public**

**Acceptance criteria:**
- [ ] Both tables queryable in Table Editor
- [ ] RLS policies visible under Authentication → Policies
- [ ] `release-artwork` bucket exists and is public

---

### Task 4: Seed database from mock data

SQL editor → run:

```sql
insert into shows (date, venue, city, country, ticket_url, is_sold_out, is_free) values
  ('2025-08-15', 'VELD',         'Toronto',  'CA', 'https://example.com/tickets/1', false, false),
  ('2025-09-03', 'Stereo',       'Montreal', 'CA', 'https://example.com/tickets/2', false, false),
  ('2025-10-11', 'New City Gas', 'Montreal', 'CA', null,                             true,  false),
  ('2025-10-11', 'Newspeak',     'Montreal', 'CA', null,                             true,  false),
  ('2025-11-22', 'Yoko Luna',    'Montreal', 'CA', null,                             false, true);

insert into releases (title, release_date, type, artwork_url, spotify_url, soundcloud_url, bandcamp_url) values
  ('Threshold', '2025-03-01', 'ep',     '/images/threshold-artwork.png', 'https://open.spotify.com/placeholder', 'https://soundcloud.com/placeholder', null),
  ('Mecca',     '2026-04-10', 'single', '/images/mecca-solbo.png',       'https://open.spotify.com/placeholder', null,                                  null),
  ('Periphery', '2024-06-20', 'album',  '/images/periphery-artwork.png', 'https://open.spotify.com/placeholder', null,                                  'https://bandcamp.com/placeholder');
```

Update placeholder URLs with real ones before going live.

**Acceptance criteria:**
- [ ] `select count(*) from shows` → 5
- [ ] `select count(*) from releases` → 3

---

### ✓ Checkpoint 2: Supabase live with schema and seeded data

---

## Phase 3 — Wire Up the Frontend

### Task 5: Supabase server client + real env vars

Replace `lib/supabase.ts` placeholder with:

**`lib/supabase-server.ts`** (server only — never import in client components):
```ts
import { createClient } from "@supabase/supabase-js";
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

Then update the three env vars in Vercel with real values from Supabase → Project Settings → API.

**Acceptance criteria:**
- [ ] `npm run build` passes with 0 errors
- [ ] `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix

---

### Task 6: API routes — shows and releases

**`app/api/shows/route.ts`:**
```ts
import { supabaseAdmin } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
export async function GET() {
  const { data } = await supabaseAdmin.from("shows").select("*").order("date");
  return NextResponse.json(data);
}
```

**`app/api/releases/route.ts`:**
```ts
import { supabaseAdmin } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
export async function GET() {
  const { data } = await supabaseAdmin.from("releases").select("*").order("release_date", { ascending: false });
  return NextResponse.json(data);
}
```

**Acceptance criteria:**
- [ ] `GET /api/shows` returns seeded shows as JSON
- [ ] `GET /api/releases` returns seeded releases as JSON

---

### Task 7: Replace mock imports in section components

Update `Shows.tsx` and `Music.tsx` — replace `import { mockShows } from "@/data/mock"` with a server-side fetch. Add `NEXT_PUBLIC_SITE_URL=https://[client-domain]` to Vercel env vars.

```ts
const shows = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/shows`).then(r => r.json());
```

**Acceptance criteria:**
- [ ] Public site renders data from Supabase
- [ ] Edit a row in Supabase Table Editor → site reflects change after reload
- [ ] `data/mock.ts` no longer imported in any section component
- [ ] `npm run build` clean

---

### Task 8: Spotify + SoundCloud iframe embeds

When a release has a `spotify_url` or `soundcloud_url`, render the public embed `<iframe>`. Convert URLs server-side:

- Spotify: `https://open.spotify.com/track/ID` → `https://open.spotify.com/embed/track/ID`
- SoundCloud: `https://soundcloud.com/user/track` → `https://w.soundcloud.com/player/?url=https://soundcloud.com/user/track&auto_play=false`

**Acceptance criteria:**
- [ ] Spotify embed plays audio in browser
- [ ] SoundCloud embed plays audio in browser
- [ ] Embeds use `loading="lazy"`
- [ ] No API keys in client-side code

---

### ✓ Checkpoint 3 — Final: Site fully live

- [ ] All sections render real Supabase data
- [ ] Custom domain with SSL
- [ ] Client can manage content in Supabase Studio (Table Editor + Storage)
- [ ] Spotify + SoundCloud embeds playing
- [ ] No console errors in production
- [ ] `npm run build` clean

---

## How the Client Manages Content

**No login to the site needed.** The client goes to `supabase.com`, logs into the project, and uses:

| Task | Where in Supabase Studio |
|------|--------------------------|
| Add / edit a show | Table Editor → `shows` |
| Mark show as sold out | Table Editor → `shows` → toggle `is_sold_out` |
| Mark show as free | Table Editor → `shows` → toggle `is_free` |
| Add ticket link | Table Editor → `shows` → edit `ticket_url` |
| Add / edit a release | Table Editor → `releases` |
| Upload artwork | Storage → `release-artwork` → Upload file → copy public URL → paste into `artwork_url` |
| Add Spotify / SoundCloud link | Table Editor → `releases` → edit `spotify_url` / `soundcloud_url` |

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `service_role` key exposed to browser | Critical | Never use `NEXT_PUBLIC_` prefix — server-only import |
| SoundCloud URL format varies | Med | Normalize URL before building embed src |
| Artwork URLs break if storage path changes | Med | Store full public URL in DB, not relative path |
| Domain propagation delay | Low | Use Vercel preview URL while waiting |

---

## Notes

- **`data/mock.ts`:** Keep for local dev fallback — only remove the import from section components
- **Client Supabase login:** Share project URL + invite via Supabase → Settings → Team
- **Custom domain:** Can be set up any time — does not block Phase 2 or 3

---

## Phase 4 - Optimization & Handoff

### Task 9: Ponytail audit and safe simplifications

Run `/ponytail-audit` after the design polish and production migration tasks are complete. Apply only simplifications that are clearly safe, scoped, and behavior-preserving.

**Acceptance criteria:**
- [ ] Audit findings are reviewed before changes are applied
- [ ] Only safe, local simplifications are implemented
- [ ] No production behavior, data flow, or accessibility behavior regresses
- [ ] `npm run build` passes

---

### Task 10: Write client guide

Create `docs/client-guide.md` as a plain-language handoff for the client.

Include:
- Where to edit shows: Supabase Studio -> Table Editor -> `shows`
- Where to edit releases: Supabase Studio -> Table Editor -> `releases`
- Where to upload artwork: Supabase Studio -> Storage -> `release-artwork`
- Where to enter Spotify and SoundCloud links
- Where social, booking, and placeholder links currently live
- How to preview changes before considering them done
- What to check before publishing
- Who should handle broken domains, env vars, failed builds, missing credentials, or DNS issues

Use the existing "How the Client Manages Content" table in this plan as the starting point.

**Acceptance criteria:**
- [ ] `docs/client-guide.md` exists
- [ ] The guide is understandable to a non-developer client
- [ ] Shows, releases, artwork, embeds, links, previewing, and troubleshooting are covered

---

### Task 11: Final pre-launch checklist

Complete final production QA after all implementation and handoff docs are done.

**Acceptance criteria:**
- [ ] Real client URLs replace placeholder Spotify, SoundCloud, ticket, booking, and social URLs
- [ ] Production site loads with no console errors
- [ ] Custom domain has valid SSL
- [ ] Supabase shows and releases render on the public site
- [ ] Editing Supabase content is reflected on the site after reload or cache refresh
- [ ] Spotify and SoundCloud embeds load and play in browser
- [ ] Lighthouse pass is acceptable for launch
- [ ] `npm run build` passes

---

### Checkpoint 4: Optimization, handoff, and production QA complete
