# Task 3.3 — Port Footer and wave containers: evidence

**Date:** 2026-08-06
**Branch:** `migration/astro-7-cloudflare`
**Legacy source ported:** `Kev.Sun/components/sections/Footer.tsx` (read-only reference; unchanged). `Kev.Sun/components/gsap/WavesBackground.tsx` inspected only to determine what the static host container needs to accommodate later — not ported itself.

## What shipped

| Artifact | Role |
|---|---|
| `src/components/Footer.astro` | Section markup and scoped vanilla CSS. Zero client JavaScript. |
| `src/pages/index.astro` | Mounts `<Footer />` after `<Shows />`. |

Ported: the booking/inquiries block (label + `mailto:` link from `site.bookingEmail`), the content-driven link row + copyright, the desktop-horizontal and mobile-vertical "SÖLBO" watermark layers, and the `.safe-bottom` inset handling (reused the existing global utility rather than reimplementing it).

**Wave container is a deliberately empty host, not a placeholder shell.** The plan text for Task 4.4 leaves the render strategy open ("canvas/WebGL/CSS shader strategy... a React island is permitted only with a measured budget and checkpoint approval"), so this task does not pre-build an `<svg>` or `<canvas>` skeleton that Task 4.4 would just replace. `.footer__waves` is a single `aria-hidden` div with the full-bleed absolute sizing and z-index the legacy component used; a `ponytail:` comment in the markup names this explicitly (ceiling: no visible wave until 4.4; upgrade path: 4.4 mounts its renderer into the existing element).

Deferred to Task 4.3, same convention as `Music.astro`/`Shows.astro`: the desktop booking/link entrance stagger and the mobile scrub-in. Hover states on the booking email and links use real CSS `:hover`/`:focus-visible` in place of the legacy inline `onMouseEnter`/`onMouseLeave` handlers.

## Content source change (same pattern as Task 3.1)

Legacy hardcoded five links (Spotify, SoundCloud, Instagram, TikTok, Facebook) via `mockLinks`. This port reuses the exact filter Music.astro already established (`kind` is `listen`/`buy`/`social`) against the real `links` collection, so it resolves to the same three enabled destinations Music shows (Instagram, TikTok, Facebook) plus two pending labels (Listen, Buy) instead of dead links. Not a new decision — same content-driven substitution already documented and accepted in Task 3.1.

## Bugs self-caught before verification

- **Copyright year.** Legacy calls `new Date().getFullYear()` client-side on every page load, so it self-corrects on January 1st without a deploy. This route is prerendered (`export const prerender = true`), so the same call in the component frontmatter freezes the year at build time. Computing it at build time is the correct lazy default for a static route — a client script for one number isn't justified — but it has a real ceiling, so it's marked: `ponytail: frozen at build time; if a Jan 1 rollover with no deploy ever matters, either a one-line inline script or moving this route off full prerendering would fix it.` (comment lives with the `year` calculation in the component frontmatter).
- **Desktop watermark line-height.** First pass dropped `line-height: 0.9` on the desktop wordmark, which legacy uses (alongside `max-height: 0.7em; overflow: hidden`) to control how much of the oversized text gets cropped. Caught and fixed before running check/build — same category of "breakpoint-specific value silently lost in the port" as the bugs caught in Tasks 3.1/3.2, this time before it reached review.

## Ponytail-review finding, applied

An empty `<span class="footer__spacer">` plus a two-rule `display:none → display:block; flex:1` toggle existed only to push the copyright to the far right on desktop. Replaced with `margin-inline-start: auto` on `.footer__copyright` inside the existing desktop media query — same visual result, one fewer DOM node, two fewer CSS rules. Verified in the rebuilt output that no `footer__spacer` reference remains.

## Verification

Toolchain pinned to Node 22.12.0 / npm 10.9.0 throughout.

| Check | Result |
|---|---|
| `npm run check` | 0 errors, 0 warnings, 0 hints (11 files) + 3/3 tests |
| `npm run build` | Passed; Cloudflare Worker output plus prerendered `/` |
| React runtime on the public route | 0 `<script>` tags in `dist/client/index.html` |
| Emitted markup | Inspected directly (existing `links` content already covers the populated case — no fixture needed, unlike the empty `shows`/`releases` collections in 3.1/3.2): booking email resolves to `mailto:booking@solbo.studio`, three enabled links render as real anchors, two pending links render as non-interactive spans, copyright reads "© 2026 Sölbo", wave host and both watermark layers present and `aria-hidden` |

## Code review

`/ponytail-review` plus an independent `code-reviewer` sub-agent pass. Verdict REQUEST CHANGES on two Important findings, both fixed and re-verified; two Suggestions applied, one left as documented.

1. **Desktop spacing regression (un-annotated).** `.footer__booking`'s `margin-bottom` was a flat `var(--space-8)` (4rem) at every breakpoint. Legacy's Tailwind v4 `mb-15 md:mb-55` computes to 3.75rem mobile / **13.75rem desktop** (0.25rem step, confirmed against the legacy `package.json` and `globals.css` — no config overrides the multiplier). The flat value collapsed a 220px desktop gap between the booking block and the link row down to 64px, a ~3.4x reduction. Fixed to the exact legacy figures at both breakpoints, with a comment noting no token in the space scale is close to either value.

2. **Box-model bug reintroduced by my own earlier self-caught fix.** Legacy's desktop watermark is two nested divs: an outer pinned to `left:0` with explicit `width:100%`, wrapping an inner **normal-flow** div with `width` left `auto` and `margin-left:-6vw`. Per CSS2.1 §10.3.3, a normal-flow block with `width:auto` and a specified `margin-left` solves width to absorb that margin — so the inner div grows leftward by 6vw while its right edge stays exactly flush with the container. When I flattened this to one absolutely-positioned element earlier this session (fixing the `line-height` bug), I pinned `left:0`, `right:0` (via the `inset` shorthand), **and** `width:100%` simultaneously. With width explicitly fixed, `margin-left:-6vw` just slides both edges left instead of only the left one — the right edge ends up 6vw short of the footer's edge, which legacy never has. I traced the CSS positioned-layout algorithm (§10.3.7) by hand to confirm: with `left`/`right` both specified, `width` left `auto`, and `margin-left` a specified non-auto value, width auto-resolves to `container_width − left − right − margin-left − margin-right`, which reproduces legacy's grow-to-absorb-the-margin behavior exactly. Fixed by removing `width: 100%` and documenting why in a comment, so a future edit doesn't accidentally re-add it as a "redundant-looking" property.

Two Suggestions applied:

- **`platformLinks` was duplicated verbatim** in `Music.astro` and `Footer.astro` — not speculative, already live in two call sites. Extracted to `getPlatformLinks()` in `src/lib/content.ts`, alongside the other build-time accessors. Verified byte-for-byte identical emitted output in both sections before and after.
- **Wave-host comment was narrower than its own claim.** It said "the sizing/z-index below already matches" what Task 4.4 will need, but `pointer-events: none` is one property that likely won't carry over — legacy's wave field binds `touchmove` to the container element itself (mouse tracking is window-level, so only touch needs a live hit target). Added a clause naming this explicitly so Task 4.4 doesn't inherit silently-dead touch input.

One Suggestion left as-is, documented rather than changed: `.footer__links` gap is `var(--space-4) var(--space-5)` (1rem/1.5rem column-gap) vs legacy's 1.25rem column-gap — a 4px difference with no matching token, consistent with the token-snapping convention already established across `Music.astro` and `Shows.astro`.

Confirmed correct by the reviewer without changes: `aria-hidden` scoping (wave host and both watermark layers are genuinely decorative, unlike the informational content wrongly hidden in Task 3.2's first pass), the `margin-inline-start: auto` spacer removal reproduces legacy's flex-spacer result exactly at both breakpoints, the copyright-year `ponytail:` comment is accurate, and the `mailto:` construction is safe (schema-validated email, Astro auto-escaping, no injection surface).

## Re-verification after fixes

| Check | Result |
|---|---|
| `npm run check` | 0 errors, 0 warnings, 0 hints (11 files) + 3/3 tests |
| `npm run build` | Passed; 0 `<script>` tags |
| `getPlatformLinks()` extraction regression check | Byte-compared Music's and Footer's emitted link markup against pre-refactor output — identical |

## Outstanding

Closed 2026-08-07: viewport captures (375×812/768×1024/1440×900) and the keyboard-focus pass, previously blocked on no browser being available. Evidence: `references/checkpoint-3-captures/`, script: `e2e/checkpoint-3-evidence.spec.ts`. Keyboard tab order confirms the Footer link row and booking mailto both get real accessible names and a visible focus ring; no parity defect found.
