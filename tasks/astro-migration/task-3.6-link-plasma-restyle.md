# Task 3.6 amendment — `/link` Plasma restyle

**Human-directed, human-approved 2026-08-08.** Unplanned work that reopens the
Checkpoint 3-approved `/link` visual system at the human's request. It does not
change Task 3.6's acceptance criteria, its budget, or its isolation rules — all
of those still hold and are re-verified below.

## Why

The human asked for `/link` to read as polished as a Komi artist page
(reference: `https://simbasol.komi.io/`) while staying inside the Sölbo
industrial language, and supplied an approved WebGL "Plasma" shader background.

The captured reference showed Komi's polish comes from three things the light
`/link` did not have: a large portrait leading the page, a single narrow centred
column over an ambient field (instead of a 48 rem column stranded in dead grey
space at 1440), and a flat monochrome social row instead of six brand colours.

## Decisions the human made

| Question | Chosen | Consequence |
|---|---|---|
| Light page vs dark | **Dark flip, full Komi structure** | The shader is visible on every viewport; the page moves to a dark ground. The alternative (keep paper, shader only in the desktop void) would have hidden the shader on mobile, where the social traffic actually lands. |
| Hero treatment | **Large portrait card** | New derived asset, see below. |
| Backdrop hue | **Keep copper — ship `u_finish.x = 3.04` exactly as specced** | See the hue note below; page accents were retuned warm to match. |

## The hue conflict, and how it was resolved

The brief specified both a cyan palette (`#031C26 → #1B6CA8 → #5AD2F4 →
#EAF9FF`) **and** `hue 174°` (`u_finish.x = 3.04` rad). These contradict: the
shader applies `hueRotate()` as a post effect, so those four colours render as
copper, not cyan — very nearly their complement. Side-by-side proof:
`references/link-plasma-restyle/hue-compare.webp`.

The human chose to keep the specced copper. Every foreground colour was
therefore re-derived by running the four brief colours through the shader's own
YIQ rotation rather than by eye:

```
#031C26 → #271102      #1B6CA8 → #964E02
#5AD2F4 → #FF9760      #EAF9FF → #FFF2E9
```

Those are the page's `--link-deep`, `--link-accent`, and `--link-ink`. The
no-JavaScript CSS fallback gradient uses the rotated values too — with the
unrotated cyan it would have been the one surface on the site not matching the
shader.

## Hero asset

`public/images/solbo-portrait.webp` — 800×1000, **27.3 KiB**. Derived from the
untracked source `public/images/04.JPG` (3072×4608) via
`crop=3072:3840:0:600` (removes dead wall above the subject) then
`scale=800:1000`, libwebp quality 74. The existing `solbo-profile.jpg` is
100×100 and could not carry a large portrait. Left in colour and greyscaled in
CSS, matching the treatment already used on the editorial image.

The large source JPGs stay untracked — they are Phase 4 hero media.

## Contrast — measured, not assumed

Every colour on the page changed, so every pair was re-measured against the
**brightest pixel the shader actually paints** (`rgb(162,150,142)`, found by
rendering the shader offscreen with `preserveDrawingBuffer` across seven time
slices), composited through the veil and each card's own translucency.

The first pass found a real defect this restyle introduced: at the original 28%
veil the `#FF9760` focus ring on the social chips and the primary CTA landed at
**2.3:1** against a bright wisp, under the 3:1 minimum for a focus indicator.
Fixed by raising the veil ramp to 50% → 58% → 66% and giving the two pieces of
small type that sit on the bare backdrop (`.identity__location`, the copyright)
their own stronger alphas instead of the card-tuned `--link-dim`/`--link-faint`.

Final, worst case:

| Pair | Ratio | Needs |
|---|---|---|
| SÖLBO wordmark | 7.32:1 | 3.0 |
| MONTRÉAL, QC | 5.22:1 | 4.5 |
| focus ring (chips + CTA) | 3.77:1 | 3.0 |
| section heading | 8.78:1 | 3.0 |
| card label | 13.62:1 | 4.5 |
| card detail / show note | 5.30:1 | 4.5 |
| "SOON" pill | 3.05:1 | 3.0 |
| micro link | 7.01:1 | 4.5 |
| booking mail | 10.49:1 | 4.5 |
| copyright | 5.36:1 | 4.5 |

All pass. This is a genuine improvement on the Checkpoint 3 position, where
`/link`'s legacy-inherited contrast was accepted as a parity exception.

## Acceptance re-verified

| Criterion | Result |
|---|---|
| `npm run check` | 0 errors / 0 warnings / 0 hints, 3/3 unit tests |
| `npm run build` | clean |
| Transfer | **85.9 KiB** against the 200 KiB budget |
| Public React | none (`window.React` absent, no React markers) |
| Hero sequence | **0** requests for `hero-frames` / `frames-mobile` / `.avif` |
| No JavaScript | hero decodes, all 6 destinations present, CSS gradient stands in for the shader |
| Reduced motion | artwork renders, **0** rAF calls — frozen, not blank |
| Hidden tab | rAF count stops advancing |
| DPR | capped at 2 (750×1624 @375, 2880×1800 @1440) |
| Console | no errors at any of the three viewports |
| Keyboard | 7 stops, every one with a visible outline — `references/checkpoint-3-captures/link-focus-order.md` |
| Full e2e suite | **27/27 passing** |

Captures: `references/link-plasma-restyle/` (after / before / Komi reference).
The tracked Checkpoint 3 `/link` captures were regenerated to the new design;
the `home-*` captures were deliberately reverted — `/` was not touched, and
their byte churn is hero-frame render nondeterminism, not a change.

## Invariant that moved

`e2e/task-4.1-motion-lifecycle.spec.ts` asserted `/link` ships **0** script
tags. It now ships exactly **1** — the decorative backdrop, the first client
JavaScript this route has ever carried. The assertion was rewritten to check
what it was actually protecting (no motion library, no React, no Hero
sequence), not a count of zero. `e2e/link-plasma-backdrop.spec.ts` locks the
new behaviour.

`e2e/checkpoint-3-evidence.spec.ts` needed a `pauseBackdrop()` step: a
continuous rAF loop never yields the stable frame `page.screenshot()` waits
for, so every `/link` capture timed out until the backdrop was paused via its
own `visibilitychange` handler. Guarded on the canvas existing, so `/` is
unaffected.

## Known, deliberate, still open

- `hash22()` in the fragment shader is dead code — nothing calls it. Left
  byte-identical because the brief pinned the shader; −7 lines whenever that
  pin is lifted.
- `.film` grain overlay was halved (0.07 → 0.04) rather than deleted, on top of
  a shader already running `u_grain 0.35`. It still grains the cards and text,
  which the shader cannot reach. −12 lines if cut.
- `u_space` is uploaded as all zeros, which is already the GL default; `u_cursor`
  passes three components the shader never reads while presence is 0. −2 lines.
- LISTEN and BUY still render the "SOON" state. Real Spotify / SoundCloud /
  Bandcamp destinations must come from the human (Task 5.2) and were not
  invented here.
