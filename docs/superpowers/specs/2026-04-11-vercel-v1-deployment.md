# Sölbo — Vercel v1 Deployment Spec

**Date:** 2026-04-11  
**Status:** Approved  
**Goal:** Deploy a clean, production-ready v1 test build to Vercel for client review. Mock data stays in place. Supabase wired up in a later phase.

---

## Scope

- Code cleanup: remove dead files, unused imports, non-production assets
- TypeScript + build verification before deploy
- Deploy via Vercel CLI to a client-shareable preview URL
- Environment variables configured in Vercel dashboard with dummy Supabase values

## Out of Scope

- Supabase integration (deferred to post-client-approval phase)
- CMS or content management
- Custom domain (v1 uses Vercel's generated URL)
- Auth, analytics, or any backend beyond static rendering

---

## Cleanup — Completed

| Action | File | Result |
|--------|------|--------|
| Deleted — dead component | `components/gsap/MusicShaders.tsx` | Unused |
| Deleted — dead component | `components/ui/background-paper-shaders.tsx` | Unused |
| Deleted — dead hook | `components/gsap/useImageDrop.ts` | Unused |
| Deleted — placeholder assets | `public/next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg` | Next.js defaults |
| Deleted — scratch file | `demo.tsx` (root) | Leftover |
| Gitignored | `.claude/`, `.superpowers/` | Internal tooling, not for deploy |
| Verified | `public/` — 22MB total | frames-mobile + images only |

---

## Component Map — Active

```
app/
  layout.tsx         — Root layout, fonts, SmoothScroll
  page.tsx           — Composes Hero → Shows → MusicFooterShell(Music + Footer)

components/
  SmoothScroll.tsx   — Lenis smooth scroll init
  sections/
    Hero.tsx         — Frame-sequence animation hero
    Shows.tsx        — Shows list with GSAP parallax
    Music.tsx        — Releases grid (Spotify + SoundCloud)
    Footer.tsx       — Footer with WavesBackground
  gsap/
    MusicBackground.tsx    — Shader background for music section
    MusicFooterShell.tsx   — GSAP scroll pin wrapper for Music + Footer
    WavesBackground.tsx    — Animated waves for footer
    useScrollAnimations.ts — Shows section scroll hooks
  ui/
    shows-list.tsx   — Shows table UI component
    wave-loader.tsx  — Loading animation for Hero

data/
  mock.ts            — Hardcoded shows, releases, links (intentional for v1)

lib/
  supabase.ts        — Placeholder, commented out (ready for phase 2)

types/
  index.ts           — Shared TypeScript types
```

---

## Build Verification — Completed

- `tsc --noEmit` — 0 errors
- `npm run build` — clean, 0 warnings
- Output: static site, single route `/`

---

## Deployment Plan

### Step 1 — Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2 — Link project to Vercel
```bash
vercel
```
Follow prompts: link to existing account, create new project named `solbo` (or `kev-sun`).

### Step 3 — Set environment variables in Vercel dashboard
In Vercel → Project → Settings → Environment Variables, add:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | dummy value from `.env.local.example` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dummy value from `.env.local.example` | Production, Preview |

### Step 4 — Deploy preview
```bash
vercel
```
Returns a preview URL to share with the client.

### Step 5 — Promote to production (when ready)
```bash
vercel --prod
```

---

## Phase 2 — Supabase (deferred)

After client approves v1:
1. Create Supabase project
2. Migrate `data/mock.ts` data to Supabase tables
3. Wire up `lib/supabase.ts`
4. Replace mock imports with Supabase queries in each section
5. Update env vars in Vercel with real Supabase credentials

---

## Success Criteria

- [ ] `npm run build` passes with 0 errors
- [ ] Vercel CLI deploys without errors
- [ ] Preview URL loads all 4 sections correctly
- [ ] No console errors in browser
- [ ] Client can view and navigate the site on the preview URL
