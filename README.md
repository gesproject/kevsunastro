# Sölbo — Astro 7 / Cloudflare

Public site for Sölbo (electronic artist, Montréal). Astro-first, zero
client-framework islands on public routes, deployed as a Cloudflare Worker.

## Stack

- **Astro 7.1** (static prerender + Cloudflare adapter for server routes)
- **Motion:** GSAP timelines + Lenis on the homepage; vanilla WebGL/2D canvas
  fields (`src/lib/motion/`) — no React ships to the browser
- **CMS:** Keystatic (editorial config in `keystatic.config.mjs`, content in
  `src/content/`)
- **QA:** `astro check` + Node unit tests + Playwright e2e (`e2e/`)

## Getting started

```bash
nvm use          # Node 22.12.0
npm ci           # deterministic install from the lockfile
npm run dev      # http://localhost:4321
```

## Before submitting a migration task

```bash
npm run check    # astro check + unit tests
npm run build    # production build to dist/
```

## Repository rules

See `AGENTS.md` for the full contract. Highlights:

- Public routes are Astro-first: no React island without a measured,
  explicitly approved exception.
- `/` is the cinematic homepage; `/link` is the social hub and must stay
  under its 200 KiB budget with no Hero media.
- Honor `prefers-reduced-motion`, keep native scrolling, and keep semantic
  no-JS content available before any animation work.
- Licensed Neue Haas Grotesk OTFs stay unshipped in `brand-assets/neue-haas/`
  until web embedding rights are confirmed.
- Never commit credentials or mutate production Cloudflare/DNS/Vercel/Supabase
  outside approved migration tasks.

## Canonical URL

`astro.config.mjs` derives `site:` from `SITE_URL` (default: the current
workers.dev preview). Set `SITE_URL` in CI when the production domain lands.

## Historical plans

The original Next.js + Supabase + Vercel build was removed after the Astro
migration reached parity; the pre-cleanup state is preserved at git tag
`pre-cleanup-snapshot`.
