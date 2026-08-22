# Task 0.3 — Measured budget baseline

**Captured:** 2026-07-28
**Scope:** current Next.js production build served locally with `next start`; evidence only. No source, deployment, environment, DNS, Vercel, or Supabase changes were made.

## Reproducible profile

This is a cold-cache, production-build baseline, not a Next development-server measurement. Task 0.1 could not establish that the reachable public Vercel candidate was this current deployment, so no public-production latency claim is made here. The local profile makes the current code, request shape, and bytes repeatable; a confirmed public URL is required for a later field/edge comparison.

1. Run `npm run build` (observed: exit 0; Next 16.2.2 production build).
2. In a separate terminal, run `npm start -- -p 3003`.
3. Run the cold mobile network capture in PowerShell:

   ```powershell
   $env:TARGET_URL='http://127.0.0.1:3003/'; $env:RUN_LABEL='network-hero-mobile-cold'; $env:CDP_PORT='9333'; node tasks/astro-migration/references/task-0.3/capture-network-hero.mjs
   ```

   The runner uses a fresh temporary Edge profile, disables the CDP cache, uses a 375×812 CSS-pixel mobile viewport at DPR 1, and does **not** emulate network throttling. It writes the JSON trace, CSV waterfall, and screenshot listed below. It records encoded response bytes and `content-encoding` per request.

4. With Google Chrome 150.0.7871.187 installed at `C:\Program Files\Google\Chrome\Application\chrome.exe`, run Lighthouse 12.8.2 three times, replacing `N` with 1, 2, and 3:

   ```powershell
   npx --yes lighthouse@12.8.2 http://127.0.0.1:3003/ --quiet --only-categories=performance,accessibility,best-practices,seo --preset=perf --form-factor=mobile --screenEmulation.mobile=true --screenEmulation.width=375 --screenEmulation.height=812 --screenEmulation.deviceScaleFactor=1 --throttling-method=simulate --output=json --output-path=tasks/astro-migration/references/task-0.3/lighthouse-mobile-run-N.json --chrome-path="C:\Program Files\Google\Chrome\Application\chrome.exe"
   ```

Lighthouse applies its `simulate` mobile throttling model; the CDP waterfall is deliberately unthrottled loopback. Do not compare their wall-clock timings as if they were the same test.

## Captured artifacts

- `references/task-0.3/network-hero-mobile-cold.json` — raw CDP network, DOM, readiness, and console trace.
- `references/task-0.3/network-hero-mobile-cold-waterfall.csv` — sortable request waterfall.
- `references/task-0.3/network-hero-mobile-cold-screenshot.png` — initial 375×812 viewport.
- `references/task-0.3/lighthouse-mobile-run-{1,2,3}.json` — three raw Lighthouse reports.
- `references/task-0.3/capture-network-hero.mjs` — the capture runner. `node --check` passed after the Windows/Node 20 compatibility adjustment.

## Network and bundle baseline

The cold trace completed with 228 HTTP 200 requests and no failed requests. First-party resources account for 227 requests / 22,144,209 encoded bytes; the one remaining request transferred zero bytes. There were no Spotify or SoundCloud iframe/player requests, either initially or after the scripted entry click and scroll; their baseline cost is therefore **0 requests / 0 bytes**, not an estimate.

| First-party type | Requests | Encoded transfer | Encoding observed |
| --- | ---: | ---: | --- |
| Document | 1 | 9,573 B | gzip |
| JavaScript | 11 | 271,232 B (264.9 KiB) | 10 gzip; 1 uncompressed |
| CSS | 1 | 9,175 B (9.0 KiB) | gzip |
| Fonts | 8 | 393,663 B (384.4 KiB) | gzip |
| Images | 204 | 21,458,806 B (20.46 MiB) | uncompressed |
| Data | 2 | 1,760 B | uncompressed |
| Media | 0 | 0 B | — |

By the capture's explicit **hero-frame network-completion** boundary, 227 first-party requests / 22,144,209 encoded bytes had completed. This is a transfer boundary, not a claim that every one of those resources is render-blocking or that React has reached `framesReady`.

## Lighthouse mobile results

The following scores are the required median of the three same-profile runs. Raw reports contain the full audit details.

| Metric | Run 1 | Run 2 | Run 3 | Median | Plan target | Result |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Performance | 45 | 50 | 51 | 50 | ≥90 | Fails current baseline |
| Accessibility | 96 | 96 | 96 | 96 | ≥95 | Passes |
| Best Practices | 96 | 96 | 96 | 96 | ≥95 | Passes |
| SEO | 100 | 100 | 100 | 100 | ≥95 | Passes |
| FCP | 1.7 s | 0.8 s | 0.8 s | 0.8 s | — | Baseline only |
| LCP | 67.9 s | 12.8 s | 68.6 s | 67.9 s | ≤2.5 s | Fails current baseline |
| Total Blocking Time | 815 ms | 586.5 ms | 572.5 ms | 586.5 ms | — | Context only |
| CLS | 0 | 0 | 0 | 0 | ≤0.1 | Passes |

Lighthouse's navigation audit did not produce an INP value because it performs no interaction. Total Blocking Time is recorded for context but is **not** substituted for the plan's ≤200 ms INP gate; interaction/field validation remains required before release.

## Budget decision

The performance budgets in `plan.md` are **confirmed without amendment**. They are migration exit targets, not a claim that the current React/Next baseline already meets them. The measurements identify the exact work those targets are meant to drive, so relaxing them would hide rather than explain the migration risk.

| Plan budget | Observed baseline | Decision and reason |
| --- | --- | --- |
| First-party public JS ≤150 KiB gzip | 264.9 KiB across 11 requests | Keep target; current bundle is 1.77× the target. The current page intentionally includes a React runtime; the future public-route React budget remains 0 bytes unless a checkpoint exception is approved. |
| Initial critical-path transfer ≤1.5 MiB | 22,144,209 B (21.12 MiB) completed by hero-frame network completion | Keep target; this is 14.1× over and is dominated by initial image loading. |
| Initial hero media ≤750 KiB | 193 sequence JPEGs: 19,623,411 B (18.71 MiB) before hero-frame network completion | Keep target; this is 25.6× over. |
| Full mobile hero sequence ≤8 MiB | Same 193 JPEGs: 19,623,411 B (18.71 MiB) | Keep target; this is 2.34× over. |
| Lighthouse mobile: Performance ≥90; A11y/Best Practices/SEO ≥95 | 50 / 96 / 96 / 100 median | Keep targets; the non-performance targets already pass and the performance gap is material. |
| LCP ≤2.5 s; CLS ≤0.1; INP ≤200 ms | LCP 67.9 s median; CLS 0; INP not produced | Keep targets; LCP is failing, CLS passes, and INP needs an interaction/field check rather than an invented proxy. |

## Current hero readiness and waterfall

- `Hero.tsx` constructs 193 mobile JPEG URLs (`/frames-mobile/frame_0001.jpg` through `frame_0193.jpg`) and begins all image requests in its preload effect. The trace counts **only** exact `/frames-mobile/frame_####.jpg` paths, so it excludes the separate `/images/solbo-profile.jpg` request.
- In the cold trace, sequence-frame requests began at about 350 ms; all 193 exact frame requests completed successfully, totaling 19,623,411 encoded bytes. The final exact frame (`frame_0193.jpg`) finished at `999.147 ms`; DOMContentLoaded was 84.524 ms and the load event 272.371 ms.
- `999.147 ms` is accurately labelled **hero-frame network completion**, not hero/application readiness. The current implementation calls `img.decode()` for every frame and sets `framesReady` only after all 193 decode results have been counted (including its decode-error path); it then initializes the frame/scroll timeline and resolves the shared readiness promise for Music and Shows. This trace does not instrument that React state, so it supplies a network lower bound rather than inventing a decode/readiness time.
- The mobile **See website** control was present after the network-completion boundary with `disabled: false` and no `aria-disabled`. The scripted click succeeded, and subsequent scripted scroll reached `scrollY` 3241 of 4053. This verifies an observed entry path; it does not make the all-frame visual/timeline readiness gate progressive.
- The trace observed 0 console API events, 0 uncaught runtime exceptions, and 0 failed network requests. The waterfall is intentionally retained as data rather than summarized visually so future hero-delivery candidates can be compared by bytes, request count, and completion timing.

## Limitations carried forward

- This measures a local production build with no network emulation. It does not certify public Vercel/edge behavior, real mobile decode/memory pressure, field CWV, or an INP interaction.
- The public production deployment cannot be identified from the available Task 0.1 evidence. Re-run the same commands against an approved production URL once one is supplied; do not treat the historical `solbo.vercel.app` candidate as canonical.
- Lighthouse 12.8.2 completed with Chrome 150.0.7871.187. The identical run against Edge 150 ended with `Protocol error (Target.closeTarget): No target with given id found`, so Edge Lighthouse output was not used.
- The capture runner imports the already-installed transitive `ws@8.20.0` package because Node 20.20.2 does not expose a global `WebSocket`; no package or lockfile change was made.
