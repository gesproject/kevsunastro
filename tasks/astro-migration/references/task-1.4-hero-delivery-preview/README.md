# Task 1.4 — AVIF Hero Delivery Preview

**Scope:** local-only, isolated delivery preview. This does not modify the current Next.js app, deploy a Worker, change DNS, Vercel, Supabase, or either supplied MP4 source.

## Run locally

```bash
cd tasks/astro-migration/references/task-1.4-hero-delivery-preview
node server.mjs
```

Open `http://localhost:4174/` from the Windows host browser. In WSL, the server binds to `127.0.0.1:4174`; Windows localhost forwarding normally exposes that same port to the host browser.

## What it validates

- `public/assets/desktop/`: 233 AVIF frames derived from the approved wide master, scaled to 1920×1080.
- `public/assets/mobile/`: 193 AVIF frames derived from the approved close companion, scaled to 960px wide.
- Desktop selects the wide master at `768px` and above; mobile selects the close companion below `768px`.
- A final AVIF frame is loaded as the poster before sequence interaction.
- Scroll and range-input scrubbing request frames progressively, while the JavaScript-held image cache is capped at 32 frames.
- The failure button holds the final poster and leaves scrolling available. Reduced motion keeps the final poster and does not install a scroll lock.

The derived assets are intentionally ignored. They are test output, not production media or a source-asset replacement.

## Verification performed

- AVIF inventory: 233 desktop frames (1,250,888 bytes) and 193 mobile frames (1,563,509 bytes).
- `node --check public/preview.js`, `node --check worker.mjs`, and the no-route Worker `wrangler deploy --dry-run` passed.
- Local HTTP checks returned `200` for the page and first/final desktop and mobile AVIF assets.

## Verdict: PARTIAL

The isolated AVIF delivery path is runnable and its scroll/fallback contracts are exercised locally. A public preview was intentionally not deployed after the human chose to keep it local; therefore public-network and physical-device visual validation remain outstanding. This preview is not a substitute for the production Task 4.2 implementation or Checkpoint 1 approval.
