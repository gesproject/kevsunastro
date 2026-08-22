# Task 4.2 — Implement the approved hero sequence: evidence

**Date:** 2026-08-07
**Branch:** `migration/astro-7-cloudflare`
**Format source:** Task 1.3's approved AVIF crf32 sequence (variant A2), locked in for both device roles by Task 1.4 after the H.264 master's real-device iOS scrub was janky. Builds directly on Task 4.1's shared Lenis/GSAP/ScrollTrigger lifecycle (`src/lib/motion/lifecycle.ts`).

## What shipped

- `src/lib/motion/heroSequence.ts` — the whole engine: progressive per-breakpoint frame loading, DPR-capped cover-fit canvas draw, nearest-loaded-frame fallback, mobile pre-entry lock, "See website" enter behavior, ScrollTrigger scrub per breakpoint, a reduced-motion static path, and its own idempotent bfcache guard/teardown/reinit (mirroring `lifecycle.ts`'s pattern from Task 4.1).
- `src/lib/motion/lifecycle.ts` — extended, not replaced: `initMotionLifecycle()` now returns whether GSAP/Lenis actually activated (`false` under reduced motion), and two new exports, `pauseMotion()`/`resumeMotion()`, call the shared Lenis instance's own `.stop()`/`.start()`.
- `src/pages/index.astro` — calls `initHeroSequence()` in place of Task 4.1's direct `initMotionLifecycle()` call; `heroSequence.ts` calls it internally.
- `src/components/Hero.astro` — comment-only updates; the markup and CSS from Task 3.4 are unchanged, since the canvas/loader were already built to be filled in by this task.
- Two new real AVIF frame sequences under `public/hero-frames/`, replacing the empty canvas shell:
  - `mobile/` — 193 frames, native 1176×1080, extracted from the human-supplied `9.16.3.mp4` (mobile role).
  - `desktop/` — 233 frames, 1920×1080 (downscaled from the native 3840×2160 desktop source, halved on each axis, no crop — the canvas's own cover-fit math handles final framing at render time), extracted from the human-supplied `Solbo-Hero-V2.mp4` (desktop role).
  - Both encoded `ffmpeg -c:v libaom-av1 -crf 32 -cpu-used 6 -still-picture 1`, the exact settings Task 1.3 benchmarked and Task 1.4 approved (variant A2), applied per-frame after a lossless PNG extraction pass (matching how Task 1.3's own `encode.sh` produced its AVIF evidence, since ffmpeg's AVIF muxer only supports one encoded frame per `-still-picture 1` invocation, not a sequence).

## A pre-existing budget violation found and fixed in passing

`public/frames-mobile/` — the original 193-JPEG sequence Task 1.3 measured at 18.66 MiB, 233% of the 8 MiB mobile hero budget, and which Task 1.4 explicitly rejected in favor of AVIF — was still tracked in git and still being copied into every build's `dist/client/`, unreferenced by any current page. Removed (recoverable from git history; nothing in `src/` referenced it). The two raw source videos were also relocated from `public/videos/` (where Astro would have shipped them as public, unreferenced dead weight, ~4 MiB combined) to `tasks/astro-migration/references/task-4.2/source-video/` (not served).

## Design decisions made without a written spec, and why

Plan.md names the frame format and behavior (progressive loading, poster-first, DPR cap, resize drawing, enter behavior, scroll scrub) but not concrete resolutions/counts for the two *new* source videos supplied this session, so:

- **Frame counts** (193 mobile / 233 desktop) — each source's native frame count, used as-is; no resampling.
- **Desktop resolution** (1920×1080) — half of the native 3840×2160 on each axis, same aspect, no distortion. Rationale: the desktop canvas is CSS-masked to 38% of viewport width (`Hero.astro`'s `.hero__canvas-wrap`), so native 4K is wasted pixels never displayed even at DPR 2 on very wide screens, and would have pushed the desktop sequence well past a reasonable size (estimated ~22 MB at native resolution vs. the measured 2.6 MiB at 1920×1080).
- **No separate poster asset** — Task 3.4's own comment on the empty canvas already established the design: the section's background color is the resting "poster" state. Reused rather than duplicated as a new file.

## Task-splitting note (4.2 vs. 4.3)

Plan.md's Task 4.2 description names "scroll scrub" and "enter behavior" as this task's job; Task 4.3 is "port section timelines" (Hero, Music, Shows, Footer, one at a time). Legacy's `Hero.tsx` has both concerns in one `gsap.context()`: the frame-scrub tween *and* content-reveal tweens (headline fade-in, scroll-cue opacity, canvas melt-exit) sharing one timeline. This task ships the frame-scrub mechanism and the mobile entry gate only — the content-reveal choreography is left for Task 4.3, alongside the equivalent pass for Music/Shows/Footer, so that work lands as one consistent pass instead of splitting Hero's reveal timing across two tasks.

## A real bug found and fixed during implementation: the mobile scroll lock

The mobile pre-entry wheel/touch/key lock initially used a plain `event.preventDefault()` listener (matching a naive read of the legacy pattern). It didn't work: Lenis, once active, applies wheel/touch deltas via its own internal `scrollTo()` regardless of what any other listener already did to the event — a later `preventDefault()` from an unrelated listener doesn't stop Lenis's own already-in-flight scroll application. Confirmed directly in `node_modules/lenis/dist/lenis.mjs`: Lenis's own handler checks `isStopped`/`isLocked` *before* calling `scrollTo()`, which is also exactly the mechanism it exposes for this: `.stop()`/`.start()`. Fixed by adding `pauseMotion()`/`resumeMotion()` to `lifecycle.ts` (calling the shared Lenis instance's own `stop()`/`start()`) and routing the lock's wheel/touch half through those instead of a redundant `preventDefault()`. Keyboard scrolling is unaffected by Lenis (native browser behavior), so `keydown` prevention stays a plain listener.

## A real gap found and fixed during implementation: bfcache reinit

`initHeroSequence()` initially had no idempotent guard and no `pagehide`/`pageshow` teardown-and-reinit of its own, unlike `lifecycle.ts`'s `initMotionLifecycle()` (built for exactly this in Task 4.1). A bfcache-restored page (back button) would have come back with a dead engine — `lifecycle.ts`'s own generic `ScrollTrigger.getAll().kill()` on pagehide would kill Hero's triggers too, but nothing would rebuild them. Fixed with the same `heroActive` guard + `teardownFns` array + module-scope `pageshow` listener pattern already proven in `lifecycle.ts`, covering both the reduced-motion and full-scrub branches (canvas resize listeners, the "See website" click listener, and `gsap.context().revert()`).

## Independent review: findings and fixes

`agent-skills:code-reviewer` reviewed the implementation after the above self-found issues were already fixed. It found one more, more serious bug, plus two smaller issues, all fixed before this evidence was finalized:

1. **Critical — mobile frame-completion math didn't do what its own name/comment claimed.** The mobile frame tween was the *only* child of its `gsap.timeline()`, so the timeline's own `duration()` was derived entirely from that one tween — meaning `duration: MOBILE_FRAME_COMPLETE_PROGRESS` (0.64) canceled out algebraically against GSAP's scrub-to-`totalProgress` mapping, and frames actually finished exactly at 100% of the scroll range, not 64% as intended. The reviewer verified this against the installed `gsap` package (`totalProgress(0.68)`, the "See website" landing point, produced frame 130.56/192 — a mid-sequence frame, not the settled final image). This is exactly the trap legacy avoided by having *other* tweens (content reveals) extend the timeline's duration past the frame tween's own span — tweens this task deliberately doesn't port yet (see the task-splitting note above). Fixed by replacing the timeline+tween with a plain `ScrollTrigger.create({ onUpdate })` that derives frame index directly from `self.progress / MOBILE_FRAME_COMPLETE_PROGRESS`, clamped to 1 — no timeline-duration indirection to desync. Re-verified empirically post-fix: clicking "See website" now produces a canvas pixel-identical (0 differing pixels out of 304,500) to the true final frame, drawn independently for comparison.
2. **Important — reduced motion installed an inconsistent half-lock.** `installMobileLock()`'s wheel/touch half goes through `pauseMotion()`, a no-op under reduced motion (no Lenis instance exists); only its keydown half would have applied, blocking keyboard scrolling while leaving wheel/touch completely free. Fixed by not installing any lock at all under reduced motion — there's no pin/scrub to protect there, so "See website" is a convenience jump rather than the only way past the intro, and native scrolling (already the design for this path) is left alone entirely.
3. **Important — `MOBILE_SCROLL_END_MULTIPLIER` (1.6) and the ScrollTrigger's `end: "+=160%"` were two independent representations of the same number.** Fixed: the `end` string is now built from the constant (`` `+=${MOBILE_SCROLL_END_MULTIPLIER * 100}%` ``), so they can't drift apart. The duplicated enter-scroll-target formula (present in both the reduced-motion and full-scrub branches) was also factored into one `enterTargetY()` helper, and `MOBILE_WEBSITE_LOCK_PROGRESS` was renamed to `MOBILE_ENTER_TARGET_PROGRESS` to match what it actually represents.

The reviewer also independently verified two things claimed above rather than taking them on faith: the Lenis `stop()`/`start()` reasoning (against `lenis.mjs` directly), and that the bfcache guard/teardown is airtight across repeated pagehide/pageshow cycles (traced against `gsap-core.js`'s `MatchMedia` cleanup behavior).

## Confirmed, not a code defect: desktop's crop shows minimal motion for this footage

The desktop canvas's cover-fit crop is a pure geometric-center crop of the 1920×1080 frames (ported unchanged from legacy's math — the canvas element itself is CSS-positioned in the right 38% of the viewport by `Hero.astro`, but the *image content* within it is centered by `coverFit`, same as legacy). Verified directly (decoded frames, computed the actual on-screen crop rect from the real CSS math at 1440×900, diffed): that exact crop region is **pixel-static across the entire 233-frame desktop sequence** (0.000% difference), while the full uncropped frames differ by **9.09%** between early and late frames. Mobile's crop, by contrast, shows real motion (verified separately, ~98% of pixels differing at points). The scrub mechanism itself is wired correctly and verified working (see the verification table below); this is a framing/content question for the human to review before it's considered finished, not something addressed here. `e2e/task-4.2-hero-sequence.spec.ts`'s desktop test reflects this honestly — it asserts pin/structural behavior only, with a comment explaining why, not a false pixel claim.

## Verification

Toolchain pinned to Node 22.12.0 / npm 10.9.0 throughout.

| Check | Result |
|---|---|
| `npm run check` | 0 errors, 0 warnings, 0 hints (16 files) + 3/3 tests |
| `npm run build` | Passed |
| Script tags | `/` — exactly 1 (`<script type="module">`, bundling `heroSequence.ts` + `lifecycle.ts` + gsap + lenis); `/link` — 0, unchanged |
| React runtime | 0 React markers (`useState`/`useEffect`) in the bundled script — grepped directly, not inferred |
| Bundle size | 139,520 B raw / 51.7 KiB gzip — against the ≤150 KiB gzip first-party JS budget |
| Mobile hero sequence | 193 AVIF frames, 4.2 MiB on disk — against the ≤8 MiB full mobile hero sequence budget (52%) |
| Desktop hero sequence | 233 AVIF frames, 2.6 MiB on disk (no written budget for desktop specifically; kept in the same order of magnitude as the approved mobile number) |
| Never waits for all frames | `e2e/task-4.2-hero-sequence.spec.ts` — 191 of 193 mobile frames delayed 8s; loader still hides within 3s (frame 0 alone) |
| Missing frame degrades, never traps | Same suite — a mid-sequence frame aborted entirely; canvas still updates correctly around it, no console errors, mobile entry lock still releases when *every* frame fails to load |
| Reduced motion | Loads exactly 1 request (the final frame of the active breakpoint only, not the sequence), no `.pin-spacer` created |
| bfcache restore | Real `goto('/') → goto('/link') → goBack()` cycle — pin rebuilt, no duplicate listeners, no console errors |
| Mobile entry lands on the true final frame | Verified post-fix: canvas after "See website" is pixel-identical (0/304,500 differing pixels) to the true final frame drawn independently for comparison |
| Full regression suite | 22/22 passing: this task's 6 tests, Task 4.1's 4, the pre-existing `smoke.spec.ts`'s 2, and Checkpoint 3's evidence-capture suite's 10 (re-run as a regression check; its own screenshot/tab-order artifacts are restored to their approved baseline afterward, not overwritten with new Hero-visuals captures — Checkpoint 3 is a frozen historical approval record, not something this task re-baselines) |

## Outstanding

- **Desktop crop framing** (above) — not a code defect, needs human visual review before Phase 4's checkpoint.
- Real-device (iOS/Android) memory and transfer check, carried forward as a known gap since Task 1.3/1.4 — nothing in this environment can measure it.
- Content-reveal choreography (headline, scroll cue, canvas melt-exit) is Task 4.3's job, alongside Music/Shows/Footer, per the task-splitting note above.
