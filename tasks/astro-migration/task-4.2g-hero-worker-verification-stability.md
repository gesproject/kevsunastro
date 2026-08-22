# Task 4.2g — Stable Hero Worker verification

**Date:** 2026-08-09
**Branch:** `migration/astro-7-cloudflare`

## Scope

The normal `hero-plate-backdrop` Playwright suite initially reset local Wrangler after five assertions. The failing test was not an application defect: the shader-only breakpoint check navigated twice and started both complete 117-frame Hero loaders despite asserting only `canvas[data-hero-shader]`.

Two test-harness-only corrections make the real built-Worker check stable:

- `playwright.config.ts` explicitly binds Wrangler to `127.0.0.1` and inspector port 9230, avoiding the host's random-inspector startup failure;
- the shader-only test aborts `hero-frames/**` before its two navigations. It now proves the independent WebGL backdrop without sending 234 irrelevant static-frame requests through the same Worker. The suite's opaque-footage, scrub, frame-count, and mask tests still exercise the sequence itself.

No production route, application request, animation, asset, or visual output changes.

## Verification

- `npm run check`: 0 errors, 0 warnings, 0 hints; 3/3 unit tests passed.
- `npm run build`: Cloudflare server build passed.
- `npx playwright test e2e/hero-plate-backdrop.spec.ts --workers=1`: **7/7 passed** in 2.4 minutes against the built Cloudflare Worker in one shared process.
- Fresh final built-Worker captures were inspected at 1440x900 and 375x812. They are local ignored review artifacts at `test-results/hero-visual-review/desktop.png` and `test-results/hero-visual-review/mobile.png`; both show the final 16-level Hero field.
- `git diff --check`: clean.

## Open

Human visual approval of the Hero amendment remains required before Task 4.3's next section-timeline pass begins.
