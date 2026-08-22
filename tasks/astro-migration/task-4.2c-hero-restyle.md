# Task 4.2c — Hero: feathered key, unified short auto-advance scroll, mobile redo

**Date:** 2026-08-09
**Branch:** `migration/astro-7-cloudflare`
**Requested by:** human, as a follow-up to Task 4.2b (keyed footage + shader backdrop). Three asks, refined through two rounds of clarifying questions before implementation: (1) soften the hard cutout around the desktop subject into a thin gray-fading edge; (2) shorten the scroll sequence dramatically and auto-advance into Music once it completes, instead of a long free-scrub (desktop) or a tap-gated card (mobile); (3) redo mobile's hero entirely — the human reviewed a screenshot showing the footage extremely zoomed in and pixelated, and asked for a version that "reflects the desktop" with a "wow effect."

## What shipped

- `src/lib/motion/heroSequence.ts` — rewritten. One short pinned scrub (`PIN_DISTANCE = "+=45%"`, was `+=130%` desktop / `+=160%` mobile) shared by both breakpoints via a single `setupAutoAdvanceScrub()`, replacing the old two-path design (mobile: wheel/touch/key lock + explicit "See website" tap; desktop: long free-scrub, no gate). Frames map directly to the pin's own `self.progress` (no timeline — same trap Task 4.2 documented already, avoided the same way). Once progress crosses `ADVANCE_PROGRESS = 0.9`, `advanceToMusic()` fires once: kills the active `ScrollTrigger` (so it can't fight the tween that follows), fades `#hero`'s opacity to 0, and eases `window` to `#music`'s top over `ADVANCE_DURATION = 0.7s`. No lock, no button — scrolling down is the only input either breakpoint needs.
- `fitFrame()` (renamed from `coverFit`) generalized to both `cover` and `contain` fit, plus a vertical anchor (`anchorY`), via one scale computation (`Math.max`/`Math.min` of the two candidate per-axis scales) instead of the old cover-only ternary. Verified equivalent to the old math for desktop's existing values (default `fit`/`anchorY` reproduce the prior behavior exactly).
- `MOBILE_FRAMES` now `fit: "contain", anchorY: 1` — shows the whole native frame at up to native resolution (no upscale), docked at the bottom.
- `src/components/HeroBackdrop.astro` — the shader now renders at every breakpoint (was `>=768px` only), filling the space contain-fit leaves above mobile's now-smaller, bottom-docked image. Added a mobile-specific vertical veil (clears top, closes toward the bottom where the image and lockup text sit), keeping desktop's diagonal veil as a breakpoint override.
- `src/components/Hero.astro` — rewritten. Mobile's separate link-tree intro (portrait, Spotify stream card, "See website" button) is gone; one lockup (h1 + scroll cue) renders at every breakpoint, with a mobile-scale headline clamp added (the desktop clamp's 9rem floor would have printed 144px flat on a 375px phone). One shared seam gradient replaces the old two (`--desktop`/`--mobile`) variants, ending in Music's own background colour instead of this section's own paper.
- `public/hero-frames/desktop/*.webp` — all 233 frames re-keyed with a soft feather (`colorkey` blend 0.015, was 0) instead of a hard cutout.
- `e2e/task-4.2-hero-sequence.spec.ts` — rewritten for the new mechanics (no more lock/tap tests; new tests assert the automatic advance actually lands inside Music with the hero faded, at both breakpoints).
- `e2e/hero-keyed-backdrop.spec.ts` — updated: the shader test now asserts it runs at *both* breakpoints (previously asserted the opposite — not created on mobile); the scrub test's scroll target reduced from 800px to 150px so it exercises a mid-scrub state instead of overshooting the now much-shorter pin.

## The two clarifying rounds, and what they resolved

**Round 1** (before any code): thin feather (not a wide halo) for the key; compress the existing frame scrub rather than trim the footage; one-way auto-advance mirroring mobile's old tap flow, but automatic and much shorter; unify both breakpoints onto it, since mobile's tap-gated card was going away entirely.

**Round 2** (after investigating the mobile zoom/pixelation bug directly): the human asked for a persistent gradient seam **and** an animated crossfade between Hero and Music ("I want both"); confirmed a desktop-style scroll cue should replace the removed tap button as the sole affordance; confirmed the mobile layout is h1-only, nothing else. On the zoom fix specifically, three options were presented with real trade-offs (re-shoot mobile from the desktop 4K master; keep the existing mobile clip but stop force-cropping it; a stopgap DPR/crop cap) — the human picked the middle option, keeping mobile's own footage and real room background rather than unifying the two shoots.

## The mobile zoom/pixelation bug: what was actually wrong

Task 4.2b's own screenshot-driven investigation (see that doc) found the desktop framing bug; this task's investigation found mobile's was a different, unrelated defect, confirmed before touching any code:

- Mobile's source video (`9.16.3.mp4`, checked via `ffprobe`) is native **1176×1080** — already close to square, and already native resolution; there is no extra picture data hiding outside today's frames to reveal by cropping looser.
- `cover-fit` against a 375×812 viewport (aspect 0.46) from a 1.089-aspect source picks the width-constrained scale, drawing the image at **~1.56× its native resolution** at 2x DPR — a real upscale, not just a tight crop — and showing only the centre ~42% of the frame's width.
- Screenshot evidence (DPR 3, capped to 2 in code) at `references/task-4.2c-hero-restyle/` shows exactly this: his face fills nearly the whole screen, visibly soft/blurred from the upscale, with the portrait circle and Spotify stream card still present.

Fixed by switching mobile to `contain` fit: the whole native frame is shown at up to native resolution (here, actually *downscaled* — 780 device px drawn from 1176 native, no artifact risk at all), width-filled, vertically docked to the bottom. The empty canvas area this leaves above the image is exactly what `HeroBackdrop.astro`'s shader (now unconditional, not desktop-gated) fills — the "wow effect" the human asked for, achieved without touching mobile's own footage at all, matching the "lighter fix" they chose.

## The desktop feather

Re-ran the same measurement discipline Task 4.2b established rather than guessing a value. Recovered the original opaque frames from git history (`git show 847059b:public/hero-frames/desktop/frame_NNNN.avif` — Task 4.2b's own commit, before they were superseded and deleted), since the currently-shipped WebP set is already keyed and has no plate pixels left to feather from.

| blend | true holes (subject eroded, dev>25, alpha<200) | edge feather px (5<dev≤25, semi-transparent) | plate left opaque |
|---|---|---|---|
| 0.008 | 0 | 255 | 0 |
| **0.015** | **0** | **851** | **0** |
| 0.025 | 0 | 1,681 | 0 |
| 0.04 | 0 | 3,625 | 0 |

All four blends were clean numerically (0 holes at every value tested); the choice between them is purely how visible the feather reads. Zoomed side-by-side comparison on the hair/shoulder edge (`feather-zoom-shoulder.png`, not shipped — scratch-only) showed 0.008 still slightly hard around hair wisps, 0.04 starting to look soft/melted at the hairline; 0.015 gives a clean, visible-but-thin softening without eating into hair detail, matching "thin feather" from the first round of questions. Full 233-frame re-encode: `crop=536:893:1384:187, format=rgba, colorkey=0xBBBBBB:0.012:0.015` → `libwebp -quality 80`. Desktop sequence 3.3 MB → 3.6 MB (feathering adds semi-transparent edge pixels; still well inside the established budget).

## The persistent seam + crossfade, built without touching Music.astro

The human said "only focus on the hero," and Music.astro (edited concurrently in this session by other work) already carries a stub: `.music__seam { display: none; }` with a comment confirming the Hero→Music seam was deliberately left for this session to build. Read Music.astro (read-only) to find its actual background colour — `--music-light: #f7fee7` — and built the whole seam from Hero's own side:

- **Persistent gradient seam**: `Hero.astro`'s `.hero__vignette` (now one rule instead of two breakpoint variants) ends in `#f7fee7` — Music's literal colour value, not a shared token, since Music doesn't expose `--music-light` outside its own scope and this needed to stay Hero-only code. Commented at the point of use so a future change to Music's colour has something to grep for.
- **Animated crossfade**: `advanceToMusic()` tweens `#hero`'s opacity to 0 over the same duration as the scroll-to-Music tween, so the dissolve and the handoff finish together.

Both were explicitly requested together ("I want both") after the human was asked to disambiguate, since a persistent-seam-only design and a crossfade-only design are genuinely different scopes of work.

## Decisions made without further back-and-forth

- **`ADVANCE_PROGRESS = 0.9`**, not 1.0. Triggering a little before the pin's natural end means the handoff tween is what visibly carries the user through the last stretch, which is what makes it read as a deliberate "switch" rather than the pin simply running out. Not asked about explicitly; a reasonable default in service of the "seamless drop, then switch" language from the brief, easy to retune (one constant).
- **`SCRUB = 0.35`**, down from 0.6/0.8. A short pin reads as laggy at the old smoothing values; picked for feeling snappy rather than measured against anything.
- **Mobile's vertical veil gradient** (top-clear, bottom-closes-toward-cream) is a new, mobile-specific rule — the existing desktop veil is diagonal, built for a horizontal (subject-on-the-right) composition that doesn't map to mobile's new vertical one (subject docked at the bottom). Not contrast-measured with the same rigor Task 4.2b applied to desktop's veil (that measurement is the kind of thing worth doing once the human has seen and approved the composition, not before).
- **`.hero__canvas-wrap`'s top-fade mask is a heuristic** (fixed 20% fade), not an exact match to wherever contain-fit's resulting image height actually lands (which varies by device aspect ratio). Flagged in-code; a real fix would compute the mask stop from the same fit math `heroSequence.ts` already does, which felt like over-engineering a CSS mask before the human has seen whether the current approximation already reads fine.

## Verification

Toolchain: Node 22.12.0 / npm 10.9.0 via `fnm` (as established in Task 4.2b — this machine's default Node breaks Astro's build).

| Check | Result |
|---|---|
| `npm run check` | 0 errors, 0 warnings, 0 hints (21 files) + 3/3 unit tests |
| `npm run build` | Passed |
| Feather re-key, numeric | 0 subject-eroded pixels, 0 plate-left-opaque, at the shipped blend (0.015), across the same 7-frame sample Task 4.2b used |
| Screenshots, both breakpoints, rest/mid-scrub/post-advance | `references/task-4.2c-hero-restyle/` — confirms: feathered edge visible against the shader; mid-scrub shows a different, correctly-posed frame; post-advance lands inside Music with the hero's opacity below 1 (crossfade fired); mobile shows the full, crisp, non-upscaled frame docked at the bottom with the shader filling the space above it |
| `e2e/hero-keyed-backdrop.spec.ts` + `e2e/task-4.2-hero-sequence.spec.ts` | Run against an isolated static server (avoiding the shared machine's wrangler-dev contention documented in Task 4.2b) — see Outstanding below for the exact tally and what it does/doesn't cover |

## Outstanding

- **Human visual approval** — this is a substantial redesign of both breakpoints; screenshots are attached for review, not a substitute for it.
- **Mobile's canvas-wrap top-fade mask is approximate**, not derived from the real per-device contain-fit height (see above). Worth revisiting once the composition itself is approved.
- **The mobile veil's contrast wasn't measured** the way desktop's was in Task 4.2b. Should get the same treatment before this ships for real, once the composition is signed off.
- Real-device (iOS/Android) verification of the new mobile composition — nothing in this environment can measure it, and it matters more here than before since the whole point of this pass was fixing a mobile-specific rendering artifact.
