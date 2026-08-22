# Task 4.3 amendment — Hero opening auto-handoff

**Date:** 2026-08-09  
**Status:** Implemented; pending human visual approval of the Hero.

## Requested behaviour

On a fresh top-of-page visit, the Hero should introduce itself, then move the
visitor smoothly into Music without requiring the first scroll. The transition
must feel cinematic rather than jittery, must yield immediately to a person
who interacts, and must never create a loop when they return to the Hero.

## Implementation

- `heroSequence.ts` waits for an actual canvas paint, then waits 1.2 seconds
  before asking the shared Lenis instance to scroll to `#music` over 2.4
  seconds with a cubic in/out curve.
- The target is the existing semantic Music element. It therefore moves
  through the established 320svh CSS-sticky Hero runway and its reversible
  `--push` seam, rather than reintroducing an opacity tween or a competing
  native smooth-scroll animation.
- The one-time marker is session-scoped (`sessionStorage`, with an in-memory
  fallback), so reloads, bfcache restores, and manual returns to the top do
  not pull a visitor into Music again.
- Pointer, wheel, touch, keyboard, click, and hidden-tab events cancel the
  delay or active Lenis interpolation. Deep links, restored scroll position,
  no-JavaScript, and reduced-motion paths never schedule it.
- Frame 0 is now held as the initial Hero image even if frame 1 decodes first;
  only a genuine frame-0 failure permits the nearest loaded frame fallback.

## Verification

- `npm run check` — 0 errors, 0 warnings, 0 hints; unit tests 3/3 passing.
- `npm run build` — Cloudflare server build passing.
- `e2e/task-4.3-hero-autohandoff.spec.ts` — 7/7 against a fresh built Worker:
  desktop and mobile handoffs; wheel, keyboard, and touch interruption;
  one-time reload and back/forward behaviour; reduced motion; deep links; and
  the no-JavaScript native stack.
- The focused legacy Hero regressions pass against fresh built Workers:
  desktop push/return, desktop scrub/rewind, failed-frame reachability,
  back/forward reinitialization, and reduced motion.
- A combined 16-test legacy Hero run completed 11 assertions before the known
  Wrangler InspectorProxyWorker reset made subsequent navigations return
  `ERR_CONNECTION_REFUSED`. The remaining five cases passed in fresh Worker
  runs, so that host-process failure is not recorded as a site failure.

## Review

An independent review found no blocking issue. Its recommendations to cover
the mobile path, touch cancellation, bfcache restoration, and the frame/push
reset were incorporated before the final focused test run.

No production service, route, DNS, CMS, or deployment was modified.

## 2026-08-17 amendment — replayed final-frame intro

The human replaced the one-per-session Hero-to-Music handoff with this
behavior: every ordinary top-of-page load advances through the existing Hero
frame scrub, stops on frame 117, and leaves Music below the viewport for the
visitor's own next scroll.

- The Lenis target is the existing `120svh` frame-scrub endpoint, rather than
  `#music`; the CSS-sticky Hero→Music push stays entirely manual.
- Frame 0 and frame 117 are requested first. Intermediate frames remain
  progressive, so entry never waits for the full sequence but the final stop
  frame is ready when the intro reaches it.
- The session-storage marker is removed. A normal reload is a new intro;
  the in-memory guard still prevents bfcache from replaying the same document.
- Pointer, wheel, touch, keyboard, click, hidden-tab, deep-link,
  restored-scroll, no-JavaScript, and reduced-motion safeguards are unchanged.

Verification on the pinned Node 22.12.0 toolchain: `npm run check` reports
0 errors, warnings, and hints with 3/3 unit tests; `npm run build` passes.
The revised 7-case `e2e/task-4.3-hero-autohandoff.spec.ts` passed across fresh
built Workers: desktop/mobile final-frame stops, normal-reload replay,
interruption, bfcache, reduced motion, deep links, and no-JavaScript. The
single long Worker run passed its first five cases, then hit the documented
Wrangler reset; the remaining reduced-motion and no-JavaScript cases passed
in fresh Worker runs. A full-frame, unmocked 1440×900 probe completed at 4s
with `scrollY=1080`, `data-frame=116`, `#music` top `900px`, and no page
errors; that state held unchanged through 7s.
