# Task 3.4 — Port Hero static states: evidence

**Date:** 2026-08-06
**Branch:** `migration/astro-7-cloudflare`
**Legacy source ported:** `Kev.Sun/components/sections/Hero.tsx` (read-only reference; unchanged). `Kev.Sun/lib/heroReady.ts` and `Kev.Sun/components/ui/wave-loader.tsx` inspected for context only — the readiness promise is Task 4.x scope, and the loader's visual is reproduced in CSS, not ported as a component.

## What shipped

| Artifact | Role |
|---|---|
| `src/components/Hero.astro` | Section markup and scoped vanilla CSS. Zero client JavaScript. |
| `src/components/HeroSocialNav.astro` | The icon-based social nav, rendered by Hero twice (mobile intro, desktop lockup) with different styling. |
| `src/pages/index.astro` | Mounts `<Hero />` first; the Task 2.1-era placeholder `<div><h1>…</h1><p>Astro / Cloudflare migration foundation.</p></div>` is removed now that Hero supplies the page's real heading. |
| `src/styles/global.css` | Adds the `.film-grain` utility and its `@keyframes`, ported at global scope like the legacy stylesheet's own choice (a reusable look, not owned by one section). |

Ported: the headline, the enter affordance, the poster/canvas shell, the loading fallback, and the responsive vignette/grain overlays — every item Task 3.4 names. The `lucide-react` `ArrowRight`/`Globe2` icons are replaced with inline SVG; the `motion/react`-driven `WaveLoader` is replaced with a 5-bar CSS `@keyframes` animation, staggered via `:nth-child` delays.

## Structural departure from Hero.tsx (why, and what it changes)

Legacy renders one content lockup (real `<h1>`, social nav, scroll cue) and covers it on mobile with a separate "intro" panel at a higher z-index. The cover only lifts via `handleEnterSite`, a JS `onClick` handler — without JavaScript, the lockup's `<h1>` and its links stay permanently inert on mobile. That's a direct conflict with the Phase 3 acceptance bar quoted verbatim in `plan.md`: *"All content and controls work with JavaScript disabled."*

This port makes the mobile intro and the desktop lockup two independent, complete compositions, each with its own `<h1>`, toggled with plain CSS `display` — the same mechanism already shipped and reviewed for Footer's two watermark layers and Shows's column-count switch. Both `<h1>` elements exist in the static HTML (2 in the emitted output), but exactly one is ever exposed to the accessibility tree at a given viewport width, since `display: none` removes an element from that tree entirely — this is not the mistake caught in Task 3.2's review (`aria-hidden` incorrectly stripping *visible* content); it's the same correct, precedented pattern already accepted for Footer's watermarks.

One consequence: the mobile intro's "See website" affordance is no longer a JS `preventDefault` + GSAP `scrollTo` call. It's a real `<a href="#music">` — native same-page anchor navigation, working with zero JavaScript, jumping to the next real section (Music is the next section in document order). Task 4.3 can layer a smooth-scroll or fade-transition enhancement on top of this working default later, the same progressive-enhancement relationship the plan already specifies for `/link`'s `View site` CTA.

## Other content-model decisions

- **Social icon row resolves to Instagram/TikTok/Facebook**, not legacy's five (+Spotify, +SoundCloud). The current `links` collection has no per-platform entries for Spotify/SoundCloud (Music.astro sources those from `releases`, not `links`), so there's no valid href to point icons at — same "do not invent them" rule already applied in Music.astro and Footer.astro. Filtered directly on `kind === "social"` rather than reusing `getPlatformLinks()`, since this is an icon nav (Listen/Buy pending placeholders have no icon and don't belong in it) — a different consumption pattern from Music/Footer's text-label link list.
- **The mobile "stream on Spotify" card is omitted.** It promotes whichever release has a Spotify URL (same source Music.astro embeds), found via `releases.find((r) => r.data.spotifyUrl)`. Releases are empty until Task 5.2, so the card doesn't render today — omitted rather than pointed at legacy's literal `https://open.spotify.com/placeholder`, which was never a real destination.
- **The canvas is an empty shell**, not a placeholder image. Task 4.2 owns the AVIF sequence and hasn't run yet, so there's no approved poster asset to show. The section's own background color (`--color-paper`, the same `#c8cbc8`-snap Music.astro already established) is the resting state, matching what legacy's own canvas showed before its first frame decoded.
- **The loading indicator is hidden by default** via the native `hidden` attribute, not rendered visible-by-default. Task 4.2 will remove/restore it around real frame-loading. Without JS nothing is ever "loading," so a spinner that can never resolve would be a worse no-JS experience than none — this was a deliberate call, not an oversight, documented inline.
- **Lucide icons are simplified inline equivalents**, not exact reproductions of Lucide's source path data (which wasn't available to copy faithfully without risking a subtly wrong/broken path). The task's instruction is to replace them with inline SVG, not to byte-match a third-party icon library.

## Bug self-caught during the ponytail pass (before review)

The initial ponytail-review pass correctly flagged the social nav's markup as duplicated verbatim between the intro and lockup compositions and recommended extracting it to a shared `HeroSocialNav.astro`. Applying that extraction introduced a real bug: Astro scopes component CSS by compiling selectors like `.hero__social--intro[data-astro-cid-X]`, keyed to the specific component that declared the `<style>` block. The nav's styling rules were left behind in `Hero.astro`'s stylesheet after the markup moved to the new child component, so the compiled selectors carried `Hero.astro`'s scope hash while the rendered `<nav>` carried `HeroSocialNav.astro`'s — the attribute selectors no longer matched anything, silently dropping all of the nav's visual styling (sizing, background, border, backdrop-filter, hover states).

Caught by checking the compiled CSS output directly (`grep`ping the built stylesheet for the selector's scope-hash attribute and confirming it against the rendered element's actual attribute) rather than assuming the extraction was safe. Fixed by moving the nav's CSS rules into `HeroSocialNav.astro`'s own `<style>` block — the correct Astro pattern: each component owns and scopes its own styles. Re-verified the scope hashes match post-fix.

## Verification

Toolchain pinned to Node 22.12.0 / npm 10.9.0 throughout.

| Check | Result |
|---|---|
| `npm run check` | 0 errors, 0 warnings, 0 hints (13 files) + 3/3 tests |
| `npm run build` | Passed; Cloudflare Worker output plus prerendered `/` |
| React runtime on the public route | 0 `<script>` tags in `dist/client/index.html` |
| No-JS enter affordance | `href="#music"` confirmed present and unconditional in the emitted HTML — works via native browser anchor navigation |
| Social nav content | Both intro and lockup instances render the same 3 real links (Instagram/TikTok/Facebook) with correct icons; stream card correctly absent (empty `releases`) |
| Loader default state | `hidden` attribute confirmed present in emitted markup |
| CSS scoping | Compiled stylesheet's `.hero__social--intro[data-astro-cid-…]` selector hash confirmed matching the rendered `<nav>` element's own attribute, after the self-caught fix above |
| Headline | Both `<h1>` instances render `site.data.artistName` ("Sölbo"), toggled via `display`, never simultaneously visible |

## Code review

`/ponytail-review` plus an independent `code-reviewer` sub-agent pass. Verdict REQUEST CHANGES on one Critical and one Important finding — both real, both verified against CSS specification mechanics (not just the reviewer's say-so) before fixing, both now fixed and re-verified in the compiled output. Two Suggestions also applied.

**Critical — the loading indicator ignored its own `hidden` attribute.** `.hero__loader { display: flex; ... }` was unconditional. `[hidden] { display: none }` is only a User-Agent-stylesheet rule; any author rule setting `display` on the same element wins regardless of source order, because author-origin CSS always beats UA-origin CSS in the cascade, independent of specificity. This is verifiable directly from the CSS cascade specification, not something that needed a screenshot to confirm — the loader was rendering permanently on-screen, the exact opposite of the documented intent ("hidden by default... a spinner with no JS to resolve it would be worse than none at all"). Fixed by moving `display: flex` into a `.hero__loader:not([hidden])` rule; confirmed in the compiled CSS that the base rule no longer sets `display` and the gated rule compiles correctly scoped.

**Important — the desktop canvas would render pinned to the wrong edge.** `.hero__canvas-wrap`'s desktop override set `inset: 0` (expanding to `left: 0` among others) together with `width: 38%` — three non-auto values (`left`, `width`, and the implied `right: 0`) on an absolutely-positioned box, which is over-constrained. Per CSS2.1 §10.3.7, in an LTR document (nothing in this codebase sets `dir="rtl"`) the browser discards the specified `right` and honors `left` + `width` instead, pinning the box to the **left** 38% rather than the right. I traced this by hand against the spec text — the same exercise already done for Footer's watermark box-model bug earlier this session — rather than trusting the claim on its own. Zero visible effect today since the canvas is a genuinely empty shell, but it's exactly the kind of regression Task 4.2 would otherwise silently inherit: the frame sequence would render behind the headline instead of beside it, and the accompanying mask (`linear-gradient(to right, transparent, black 15%)`, written assuming a right-pinned box) would fade the wrong edge. Fixed by deleting the redundant `inset: 0` from the desktop block — the base rule's `inset: 0 0 0 auto` is already correct at every breakpoint; only `width` and the mask actually need to change at the 768px boundary.

Two Suggestions applied:

- **Social icon nav had no `enabled` check.** `socialLinks` filtered only on `kind === "social"`, with no guard against a disabled entry (a state the schema explicitly supports, and one already in active use elsewhere in this exact codebase — `listen.json`/`buy.json`). All three current entries are enabled, so nothing broke yet, but the first disabled social placeholder would have rendered as a silent, non-functional, href-less icon. Fixed with a one-line filter addition; an icon nav has no "pending" visual the way Music/Footer's text list does, so filtering the entry out entirely (rather than rendering a disabled icon state) is the consistent choice.
- **`.hero__canvas-wrap` was the one decorative layer without `aria-hidden="true"`**, inconsistent with its siblings (grain, both vignettes, loader). Added — it stays correct once Task 4.2 fills it, since the frame sequence remains purely decorative backdrop.

Confirmed correct by the reviewer independently, including by rendering the actual build rather than only reading source: the h1/`display:none` structural approach (exactly one `<h1>` subtree ever visible at a given viewport, verified both statically and by rendering at 390px/1400px), the `href="#music"` enter affordance (real, working, zero-JS), and the self-caught scoped-CSS fix from implementation (grepped the compiled stylesheet directly and confirmed zero orphaned `.hero__social*` rules remain under Hero's own scope hash).

## Outstanding

Closed 2026-08-07: the 375×812 / 768×1024 / 1440×900 captures and keyboard-focus pass. Evidence: `references/checkpoint-3-captures/`, script: `e2e/checkpoint-3-evidence.spec.ts`. Confirmed both HeroSocialNav variants (`intro`/`lockup`) render at the correct breakpoint with no double-visible/double-focusable state, and both icon-only links carry a real `aria-label` (each shows up in the keyboard tab order with an accessible name, not blank text). No parity defect found against the Task 0.2 baseline.
