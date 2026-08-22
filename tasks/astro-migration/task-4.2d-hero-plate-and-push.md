# Task 4.2d — Hero: plate restored, unified footage, scroll-driven push into Music

**Date:** 2026-08-09
**Branch:** `migration/astro-7-cloudflare`
**Requested by:** human, as direct feedback on the Task 4.2c build. Five asks, refined through one round of clarifying questions before implementation:

1. The cut-out behind the subject is not good — keep the artist's own background and have it fade out into the hero so there is no cutout behind him.
2. The scroll animation has to be smoother.
3. Arriving at Music should push the user into the next section as a push transition.
4. Mobile needs refactoring and optimising — "they seem to be two hero in one", and it should mimic the desktop behaviour.
5. Coming back up from Music, the hero must reappear instead of being black; and the Hero→Music seam should feel natural and seamless.

## The four decisions the human made

Asked as one round of four questions before any code was written; all four went to the recommended option.

| Question | Chosen |
|---|---|
| What sits behind the artist once the plate returns? | Plate fades into the shader — restore the opaque frames, soft-mask the plate's outer edge so the grey dissolves into the shader field |
| How to unify mobile? | Re-crop mobile from the desktop 1920×1080 master; delete the separate mobile shoot |
| Push behaviour? | Scrub-driven and reversible — Music slides up over a stationary hero, driven by scroll position, not a fired tween |
| Scroll length for the sequence? | ~120% of viewport height |

## What shipped

### Assets — one shoot, opaque, at both breakpoints

Both frame sets are now crops of the same 1920×1080 master, recovered from git (`git show 847059b:public/hero-frames/desktop/frame_NNNN.avif` — the original opaque AVIFs, before Task 4.2b keyed and deleted them). Plate flatness re-verified before re-encoding: sampled raw RGB is exactly `187,187,187` with zero deviation, matching Task 4.2b's measurement.

| | crop from master | frames | on disk |
|---|---|---|---|
| desktop | `864×1080 @ x=1056` — ~330px of plate left of the subject | 117 | 1.6 MB |
| mobile | `680×1080 @ x=1240` — tighter horizontally, full height for the ~190px of plate above his head | 117 | 1.4 MB |

`ffmpeg -i frame_N.avif -vf crop=W:1080:X:0 -c:v libwebp -quality 80`.

**WebP, not AVIF, and measured rather than assumed.** Both were encoded and timed. AVIF is smaller on disk (1.3 MB vs 1.6 MB per set) but decodes 1.5–2.5× slower for the same pixels. Full-set load + decode through the same 12-wide pool `loadSequence()` uses:

| | AVIF | WebP |
|---|---|---|
| headless | 3487 / 1798 ms | 2272 / 1124 ms |
| real GPU | 2731 / 1465 ms | 1108 / 955 ms |

This sequence is decoded in full and held decoded, so time-to-scrubbable is the number that matters and 300 KB against a multi-MB budget is not. It also matches what Task 4.2b already shipped for desktop, so it is not a novel format choice — 4.2b only reached for WebP because ffmpeg could not write an AVIF alpha plane, a constraint that disappeared along with the key.

Three things fall out of this:

- **The crop margin is the feature.** Task 4.2c cropped to the subject's union bounding box + 4px, which is precisely why nothing could be dissolved — there was no plate left to fade. Every crop here deliberately keeps a wide plate margin on the side facing open space.
- **117 frames, not 233** (every 2nd frame). The pair costs ~440 MB of held-decoded bitmap at 117, which is the same budget the old tight-cropped 233-frame set already used — spent on picture area instead of on frames that never got drawn. Over the old `+=45%` pin, 233 frames worked out to one frame per 1.7px of scroll, so most of them were skipped on any real gesture.
- **8.0 MB → 3.0 MB on disk**, and the mobile shoot (193 frames, its own 4.2 MB) is gone entirely.

### No cutout: a dissolve between two identical greys

`Hero.astro` gains `.hero__plate`, a `#BBBBBB` field — literally the footage's own measured background colour — sitting between the shader and the canvas and extending past where the footage ends. The canvas is then masked to fade out over its own plate margin. The composite reads **plate → plate → shader**, so the dissolve happens between two identical greys and only then does the grey fade into the field. There is no silhouette edge anywhere.

For those percentage masks to mean anything, `paintFrame()` now sizes and positions the canvas to the drawn frame's exact box rather than filling the wrap, and draws at the origin. The plate margin is a fixed fraction of the source crop but lands at a different fraction of the viewport at every window size, so a mask on a viewport-sized canvas could not track it.

Both breakpoints are one composition with one anchor change:

| | fit | anchor | plate fades | mask |
|---|---|---|---|---|
| desktop | contain (height-driven) | right | leftward | `to right, transparent 0%, black 32%` |
| mobile | contain (width-driven) | bottom | upward | `to bottom, transparent 0%, black 16%` |

32% and 16% are the measured plate margins (330/864 and 190/1080), so each fade completes just short of the subject and never erodes him.

### The push: CSS sticky, not GSAP

The GSAP pin is gone. `.hero-scene` is a tall block, `.hero` is `position: sticky; top: 0` inside it, and Music carries `margin-top: -100svh` with `z-index: 1`. The browser holds the hero; Music slides up over it under ordinary scroll.

```
scene height = 100svh (hero) + 120svh (SCRUB_VH) + 100svh (push) = 320svh
hero stays stuck for the middle 220svh
Music's top edge sits at 220svh, so it finishes covering exactly as the hero unsticks
```

Verified against the built page at both breakpoints: desktop scene 2880px / Music top 1980px at a 900px viewport; mobile 2700px / 1857px at 844px. `heroSequence.ts` is left doing exactly one thing — mapping scroll progress to a frame index — and `ScrollToPlugin` is no longer imported.

Both the scene height and Music's pull-up are gated on `[data-motion-lifecycle="active"]`, so without JS or under reduced motion the page collapses back to an ordinary stack of sections.

### The black-on-return bug, and why it cannot recur

Task 4.2c's `advanceToMusic()` set `entered = true` permanently, killed the trigger, and tweened `#hero` to `opacity: 0` with nothing that ever restored it. The body is `--color-ink: #0a0a0a`. That is the black.

The fix is structural rather than a restore-on-scroll-up patch: nothing is a fired animation anymore. The push is scroll position, and the one thing that does fade (`--push`, below) is a scroll-linked value with no state of its own — drag back up and it simply reads lower again.

### `--push`, and the frame it was added to fix

Music's leading edge sweeps up over whatever the hero has at that height. On mobile that is the artist's face, and a soft edge passing through it read as him sinking into the moss field. `setupPushRecede()` writes a 0..1 `--push` across the push's scroll range; the footage and the lockup fade and drift up 18svh over it, while the plate and shader stay put and stay opaque — so a partly-pushed hero is a lit grey field, never a hole onto the body's black.

The `1 - --push * 2.2` curve lands opacity 0 at 45% of the push. That is not a taste call: the artist's face sits ~44% of a viewport up from the bottom on mobile, which is where Music's edge reaches at that point.

### The seam

`Music.astro`'s `.music__seam` stub is replaced by a mask on `.music__backdrop`, which makes the section's leading edge genuinely translucent so the hero's own foot — already graded to `#f7fee7` by `.hero__vignette` — shows through it and the two fields read as one.

The ramp is front-loaded (`transparent 0, rgb(0 0 0 / 70%) 2.5svh, #000 7svh`) rather than linear. A first pass at a plain 13svh linear band was a window rather than an edge: the artist's face read straight through it as a double exposure. `.music`'s own `background` was removed — `.music__backdrop` is `inset: 0` and already carries the same `--music-light` as its no-WebGL floor, and an unmaskable duplicate would have painted straight over the translucent edge.

### Smoothness

- `SCRUB_VH` 1.2 (was `+=45%`) — the dominant fix. 117 frames across ~1080px is ~9px per frame, so each frame actually gets drawn instead of being skipped.
- `SCRUB` 0.6 (was 0.35). The old value existed to stop a very short pin feeling laggy; over 2.7× the distance there is room for real smoothing.

Verified by measurement rather than by eye — frame index against scroll position, on the built page:

| scrollY | 0 | 270 | 540 | 810 | 1080 | 1500 | 1980 | back to 900 | back to 0 |
|---|---|---|---|---|---|---|---|---|---|
| drawn frame | 0 | 29 | 58 | 87 | 116 | 116 | 116 | 97 | 0 |
| expected | 0 | 29 | 58 | 87 | 116 | 116 | 116 | 97 | 0 |

### Deletions

- `pauseMotion()` / `resumeMotion()` and the `activeLenis` module global in `lifecycle.ts` — added in Task 4.2 for the mobile scroll lock, which Task 4.2c removed. Nothing had imported them since.
- `advanceToMusic()`, `entered`, `activeTrigger`, the `ScrollToPlugin` import, `FrameSet.frame`/`crop`/`fit`, and the cover/contain branch in `fitFrame()` — the frames are self-contained images now, so there is no crop bookkeeping left.
- `public/hero-frames/mobile/` (the 193-frame separate shoot) and `e2e/hero-keyed-backdrop.spec.ts`.

## A diagnosis worth recording: the scrub was never broken

Mid-implementation the scrub appeared not to reach its final frame — headless screenshots at the end of the range showed an early pose. Instrumenting the drawn index (`data-frame` on the canvas, kept, since the e2e suite needs it too) showed the index tracking *load progress* rather than scroll position.

It was neither a scrub bug nor a server bug:

- The server serves 30 frames sequentially in 1.7s (57ms each) — not the bottleneck.
- Headless Chromium loaded 27 frames in 39s; the same page with a real GPU loaded all 117 in 8.9s, and the frame/scroll mapping was then exact at every probe.

The cause is the one already documented in `heroSequence.ts`: headless has no GPU, `/` carries two WebGL shaders on SwiftShader, and that starves the AVIF decodes badly enough that `nearestLoaded()` degrades to whatever has arrived. Worth knowing before anyone reads a headless screenshot of this hero as evidence of anything.

## Tests

Verified per spec file, each against a freshly built and freshly started server (see the last "Open" item for why the suite cannot be run in one pass here):

| spec | result |
|---|---|
| `task-4.2-hero-sequence` (rewritten) | **10/10** |
| `hero-plate-backdrop` (new, replaces `hero-keyed-backdrop`) | **7/7** |
| `task-4.3-music-backdrop` | **5/5**, and 10/10 across two repeats |
| `task-4.1-motion-lifecycle` | **4/4** |
| `link-plasma-backdrop` | **5/5** |
| `smoke` | **2/2** |
| `checkpoint-3-evidence` | not completable on this machine — see below |

`npm run check` 0/0/0 and `npm test` 3/3 pass.

Three timeouts in pre-existing specs had to be raised, all for the same reason and none of them weakening an assertion. `/`'s `load` event does not fire until the whole sequence lands (~11.5s headless), and `/` is now a ~4160px document, so: `task-4.1`'s two full-sequence tests moved to `domcontentloaded` (the lifecycle attribute is set from a module script, long before the frames finish) with a 120s budget on the one test that must sit through the real sequence because it is the only one asserting a clean console; and `checkpoint-3-evidence` got a 180s budget, since one full-page capture of `/` now takes ~40s. Worth stating plainly: `/` is *lighter* than before this task on every axis — 3.0 MB vs 8.0 MB transferred, ~109M vs ~111M decoded pixels — so these are the machine's limits, not a regression this task introduced. `link-plasma-backdrop`'s "never reaches for the Hero sequence" filter also dropped its now-dead `\.avif` clause; it cannot simply become `\.webp`, because `/link` legitimately loads `solbo-portrait.webp`.

`e2e/task-4.2-hero-sequence.spec.ts` rewritten (10 tests) — `.pin-spacer` no longer exists, so the pin assertions are replaced by scene/sticky/overlap geometry; the auto-advance assertions by the push and, specifically, by a regression test for the black-on-return bug (hero opacity, canvas opacity, lockup opacity and `--push` all back at rest, and the scrub rewound to frame 0).

`e2e/hero-plate-backdrop.spec.ts` replaces `hero-keyed-backdrop.spec.ts` (7 tests). Its central assertion inverts: the drawn bitmap must now be **>99% opaque** where it previously had to be >25% transparent. `getImageData` reads the canvas bitmap, which CSS masking does not touch, so the mask is asserted separately on computed style. Added: a check that both breakpoints serve exactly 117 frames from the same-shaped set, which is the property that would break if a second shoot crept back in.

One pre-existing flake stabilised in passing: `task-4.3-music-backdrop.spec.ts`'s pause/resume test polled for a shader draw on a 5s default. Measured on this runner, that loop manages 2–3 draws per 4 seconds without a GPU, so the test was a coin flip — it fails at `HEAD` too (1 of 2 runs with this task's `Music.astro` reverted). Confirmed *not* caused by the new seam mask: draw counts are identical with the mask forced on and off. Given a 30s poll and a matching test budget it is 10/10 across repeats.

## Open / not done

- **Human visual approval is still pending** — this whole task is a response to feedback on a build the human has seen, but they have not yet seen this one.
- Checkpoint 3's approved capture set (`references/checkpoint-3-captures/`) now depicts a superseded hero. Deliberately left at its approved bytes rather than silently regenerated; `checkpoint-3-evidence.spec.ts` rewrites those files on every run, which is worth knowing before reading them as approved evidence.
- `HeroBackdrop.astro`'s shader posterisation was reduced immediately afterward in the focused Task 4.2e amendment: the user-directed `u_intensity` retune doubles the field from 8 to 16 tonal levels without adding runtime work. See `task-4.2e-hero-backdrop-banding.md`.
- **The suite cannot be run in one pass against `wrangler dev` on this machine.** Parallel workers kill it outright; even at `--workers=1` it dies partway through a full run, and once it does `reuseExistingServer` never restarts it, so everything after reports `ERR_CONNECTION_REFUSED` regardless of what it tests. Same signature already recorded under Task 4.2b. Every spec passes when run as its own invocation against a fresh server, which is how the table above was produced.
- `checkpoint-3-evidence` is the one spec that could not be completed even that way: wrangler dies during its *first* capture and the remaining nine then fail on a dead server. A single capture run in isolation passes (40.2s), so the spec itself is sound. It is also, by its own header, "a one-shot evidence generator, not a regression suite — it isn't asserting anything," so this blocks evidence refresh rather than correctness. It needs an uncontended machine, exactly as Task 4.2b concluded.
- `rm -rf dist` is required before every build on Node 25: astro's `emptyDir` calls `rmdirSync(..., { recursive: true })`, which Node 25 removed, so a build over an existing `dist` aborts. Unrelated to this task, but it will bite the next person who runs the suite twice in a row.
