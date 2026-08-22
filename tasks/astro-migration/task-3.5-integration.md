# Task 3.5 — Integrate the static page: evidence

**Date:** 2026-08-06
**Branch:** `migration/astro-7-cloudflare`
**Code changes:** none. This task is a verification/audit deliverable — page order and mounting were already completed as part of Task 3.4, and the audit below found nothing to fix.

## Scope, verbatim from the plan

> Compose Hero → Music → Shows → Footer in the existing order. Match spacing, colors, typography, overlap, and seam states across the reference viewports.

Composition (order, mounting) was already done landing Task 3.4. This task is the cross-section verification pass.

## What was verified, and how

No browser is available in this session (same gap outstanding since Task 3.1), so pixel-level comparison against the approved reference captures is not possible here. What follows is a code-level audit: every claim below is a traced value from the actual source files, not an assumption, and each was checked directly rather than taken on memory of what I intended to write.

### Section boundary (seam) color continuity

Traced the exact background value at the bottom of each section and the top of the next, at both the mobile (<768px) and desktop (≥768px) breakpoints, by grepping the literal CSS rather than relying on recollection.

| Boundary | Mobile bottom → top | Desktop bottom → top | Match |
|---|---|---|---|
| Hero → Music | `.hero__vignette--mobile` fades to `var(--color-ink)` at 100% → `.music__mobile-bg` gradient starts at `var(--music-dark)` = `var(--color-ink)` at 0% | `.hero__vignette--desktop` fades to `var(--color-paper)` at 100% → `.music`'s own `background: var(--music-field)` = `var(--color-paper)` (mobile-bg is `display:none` at this breakpoint) | Exact, same token both sides |
| Music → Shows | `.music__seam` is `display:none` on mobile; `.music__mobile-bg` gradient reaches `var(--music-dark)` = `var(--color-ink)` at 100% (bottom) → `.shows__seam` starts at `var(--color-ink)` at 0% | `.music__seam` gradient reaches `var(--music-dark)` = `var(--color-ink)` at 100% → `.shows` has no explicit background (`.shows__seam` is `display:none` here too), so it shows the body's `background: var(--color-ink)` | Exact, same token both sides |
| Shows → Footer | `.shows` has no explicit background at any breakpoint → body `var(--color-ink)` throughout | `.footer` also has no explicit background → same body `var(--color-ink)` | Exact — both inherit the same body background, so there is nothing to mismatch |

No seam produced a color discontinuity. This wasn't incidental: Hero (built last, in Task 3.4) deliberately reused the exact `--color-paper`/`--color-ink` tokens Music had already established in Task 3.1, rather than re-deriving its own values from the legacy `#c8cbc8`/`#0e0e0c` literals.

### Structural checks against the fully composed page

Built the site and inspected the single emitted `dist/client/index.html` (not each section in isolation):

| Check | Result |
|---|---|
| DOM order | `hero` (pos 928) → `music` (pos 5726) → `shows` (pos 14948) → `footer` (pos 15869) — confirmed by string position, not assumption |
| Duplicate `id` attributes | None. `content`, `hero`, `music`, `shows`, `footer` each appear exactly once |
| Heading hierarchy | `h1 → h1 → h2 → h2` (Hero's two mutually-exclusive h1s, reviewed and accepted in Task 3.4, followed by Music's "Releases" and Shows's "Find me live.") — no skipped levels, no heading appearing before a higher-level one |
| Landmark collisions | Two `<nav aria-label="Sölbo social links">` elements exist (Hero's intro/lockup variants), mutually exclusive via `display:none` — same mechanism already scrutinized in the Task 3.4 review. No other component wraps its link row in a `<nav>`, so there is no additional collision |
| Stray `position: fixed` | None, in any of the four components — confirmed by grep, ruling out any element escaping its own section's containing block to overlap a neighbor |
| `z-index` on a non-positioned element | Checked specifically for `.hero__intro` (z-index:4): it declares `position: relative`, so the z-index is not silently ignored (z-index has no effect without a position other than `static`) |
| Cross-component CSS scoping | Verified no component references another's classnames — each of Hero/Music/Shows/Footer is a sibling `.astro` file with its own scoped `<style>` block, so the class-collision risk that caused the Task 3.4 `HeroSocialNav` bug (styling left behind in the wrong component's scope) doesn't recur elsewhere in this composition |
| Reduced motion | The one global rule in `global.css` (`@media (prefers-reduced-motion: reduce)`) suppresses `animation-duration`/`transition-duration` universally; no component defines a competing or narrower reduced-motion rule, so Hero's loader-bounce/scroll-breathe keyframes and every section's hover transitions are already covered centrally |

### Overlap

The plan's "overlap" concern maps to the scroll-pinned transition where Hero visually stays in place while the next section animates in underneath it — that's Task 4.1's pin lifecycle, not yet built. In the current static (unpinned) composition, every section is a normal block-level element in document flow; nothing overlaps a sibling section. Confirmed by the `position: fixed` audit above and by `.hero`'s own `overflow: clip`, which contains its absolutely-positioned children (canvas, grain, vignettes) within Hero's own box regardless of content height.

### Typography and spacing

All four sections already draw from the same shared scale established starting in Task 2.2 and reused consistently since: `--font-mono` for label/meta text, `--space-*`/`--page-gutter` for spacing, and the same micro-type range (~0.55–0.72rem) for uppercase label text across Music, Shows, Footer, and Hero. Section-level headline sizes differ deliberately (Hero's cinematic display size vs Shows's modest section heading) — that's the original design intent, not an inconsistency to flatten.

## Verification

| Check | Result |
|---|---|
| `npm run check` | 0 errors, 0 warnings, 0 hints (13 files) + 3/3 tests |
| `npm run build` | Passed |

## Outstanding

Closed 2026-08-07. The pixel-level comparison this task is ultimately meant to produce — matching the composed page against the approved 375×812 / 768×1024 / 1440×900 reference captures — is done. Evidence: `references/checkpoint-3-captures/`, script: `e2e/checkpoint-3-evidence.spec.ts` (captures for `/`, all three viewports, plus a reduced-motion pass and the full keyboard tab order). Compared against `references/task-0.2-production/`: seam colors, DOM order, and heading hierarchy all match the source-level audit above — nothing found needed a fix. One capture-tooling artifact was found and fixed in the script itself (a `fullPage` screenshot didn't paint the Shows photo panel, an off-screen `position: sticky` element, before the browser had scrolled near it) — not a site defect, confirmed by an isolated repro that the live page renders correctly at every breakpoint.
