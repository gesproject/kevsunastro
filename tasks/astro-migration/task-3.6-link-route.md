# Task 3.6 — Build the dedicated /link preview: evidence

**Date:** 2026-08-06
**Branch:** `migration/astro-7-cloudflare`
**Design source:** Evaluation preview E1, human-approved 2026-08-03 (`tasks/astro-migration/references/link-preview/src/pages/link.astro`), an isolated no-route Astro preview built with hardcoded mock data. This task wires that approved visual system to real build-time content — it does not re-design it.

## What shipped

`src/pages/link.astro` — a standalone route, deliberately importing nothing from the cinematic homepage's component tree (no `Hero`/`Music`/`Shows`/`Footer`), so it cannot accidentally pull in Hero media, motion libraries, or React. Uses `BaseLayout` for the document shell (metadata, skip-link, favicon) rather than hand-rolling a second parallel `<html>` document — reuse of the existing, already-implemented layout plumbing.

## Content mapping (E1 mock data → real collections)

| E1 element | Real source | Notes |
|---|---|---|
| Portrait, "SÖLBO" h1, location | `getSite()` — `profileImage`, `artistName`, `location` | `text-transform: uppercase` now does what E1's hardcoded literal caps did, so content can stay naturally cased |
| Social icon row | `getLinkActions()`, `kind === "social" && enabled` | Currently resolves to Instagram/TikTok/Facebook, same set Music/Footer/Hero already show. Inline SVG marks ported verbatim from E1 (Spotify/SoundCloud marks kept in the lookup for when those platforms get real link entries) |
| "ENTER CINEMATIC SITE" | `kind === "site"` link (`view-site.json`, `href: "/"`) | Dropped E1's `?entry=link` query decoration — not part of the validated `linkHref` schema (`https:`/`mailto:`/literal `/`), and nothing reads it yet |
| LISTEN / BUY action cards | `kind === "listen"` / `kind === "buy"` | Both currently `enabled:false` in content, so both render as pending cards — same "don't invent destinations" rule already applied in Music/Footer/Hero |
| Editorial statement + image | Kept as literal approved copy + `/images/Horizontal1.webp` (note: capital H — E1's own preview had a separate lowercase-named local copy of this asset; the real site's asset is capitalized) | This is design copy ("Tension between darkness and warmth."), not a restatement of `site.data.description` — the two serve different purposes despite thematic overlap |
| "MECCA" release card | `getReleases()[0]`, whole section omitted if empty | Releases are empty until Task 5.2; same omission pattern as Hero's stream card (Task 3.4) rather than a hardcoded placeholder |
| "NEW DATES INCOMING" shows card | `getShows()[0]` if present; E1's exact approved fallback copy otherwise | Real-show branch reuses Shows.astro's status logic (sold-out/free/ticketUrl) — a 1-line date formatter and the branch are duplicated locally rather than exported from the already-shipped, already-reviewed Shows.astro for one shared call site |
| Footer booking mailto | `kind === "booking"` link action | Real value already existed (`booking.json`) |
| "GET UPDATES" mailto | `` `mailto:${site.data.bookingEmail}?subject=Show%20updates` `` | Built from the real email instead of E1's hardcoded domain |
| Copyright year | `new Date().getFullYear()`, computed at build time | Same `ponytail:` tradeoff already documented and accepted in Footer.astro (Task 3.3): frozen until next deploy, correct default for a prerendered route |

**Not mapped to a distinct action card — deliberately:** "Shows" and "Book," two of the six action types the task text names, are fulfilled through E1's own already-designed dedicated sections (the `#shows` card, the footer mailto) rather than duplicated into the `action-stack` grid alongside Listen/Buy. E1's approved 2-column grid rhythm is for Listen/Buy specifically; Shows and Book already had their own real, working destinations in the approved design.

## Structural change from E1: document shell

E1 was a fully standalone `<html>` document. This route needs to fit into the site's existing metadata/skip-link plumbing (`BaseLayout`), so the `html`/`body`-level styling (background, color, font, the `main` wrapper's width/padding) had to move onto a self-contained wrapper `<div class="link-page">` inside the layout's `<main id="content">` slot.

First attempt reached outside the component via `:global(html:has(.identity))` / `:global(body:has(.identity))` — technically workable (`:has()` is universally supported by 2026), but it coupled the shared page chrome's background to a content-specific class name, and a second page wanting a custom background would immediately collide with it. Replaced with the self-contained wrapper before this went to review — simpler, and every rule stays inside the one file that owns it.

That restructuring surfaced two real bugs, both caught and fixed before verification:

1. **`.editorial`'s width formula was wrong on wide viewports.** E1's `.editorial` sat inside an already-padded `<main>` and needed no width rule of its own. Once it became a sibling of `.identity`/`.section`/`.footer` instead of their nested child, it needed an explicit width matching their padded content area — and `min(100%, 48rem) - gutter` is not the same expression as `min(100% - gutter, 48rem)`. The second form only subtracts the gutter from the `100%` branch; once the `48rem` branch wins (any viewport past roughly 50rem), the result is `48rem` instead of `48rem - gutter`, rendering `.editorial` visibly wider than every other content column by the gutter amount. Fixed using `min(100% - gutter, 48rem - gutter)` — algebraically `min(A,B) - C == min(A-C, B-C)` for any constant `C`, verified by hand rather than assumed.
2. **`.footer`'s own rule used the `margin` shorthand**, which happened to redeclare the same `auto`/`auto` horizontal values the shared `.identity, .section, .footer` rule already set for horizontal centering — working correctly, but only because both rules agreed by coincidence, not by design. Changed to the `margin-top` longhand so the shared rule's horizontal centering is the only place that value lives.

## Ponytail-review finding, applied

`.link-page > :not(.film, .skip-link) { position: relative; z-index: 1; }` was redundant on both counts: `position: relative` duplicates what the global `section, header, footer { position: relative }` rule already provides for every element this selector matches, and `z-index: 1` changes nothing — an element with an explicit positive `z-index` (`.film`: 10, `.skip-link`: 20) always paints above a sibling with `z-index: auto`, regardless of whether that sibling also declares a smaller explicit value. Removed; confirmed the rebuilt output is byte-identical to before the removal.

## Also fixed, self-caught

`html { scroll-behavior: smooth }` from E1 didn't carry over — the shared global stylesheet's `scroll-behavior: auto` applies instead, since another `:global(html)` reach-around wasn't worth it for this. Left as a deliberate, documented deviation rather than restored: an instant skip-link jump is arguably the better default for the assistive-tech audience skip-links exist for in the first place.

## Verification

Toolchain pinned to Node 22.12.0 / npm 10.9.0 throughout.

| Check | Result |
|---|---|
| `npm run check` | 0 errors, 0 warnings, 0 hints (14 files) + 3/3 tests |
| `npm run build` | Passed; `/link/index.html` emitted alongside `/index.html` |
| React runtime | 0 `<script>` tags in `dist/client/link/index.html` |
| Hero sequence request | 0 references to `frames-mobile`/video/preload anywhere in the emitted page |
| Initial transfer vs 200 KiB budget | HTML 10,067 B + CSS 10,248 B + the one eager image (90×90 portrait, 1,887 B) = 22,202 B uncompressed; gzip-equivalent (matching how E1's own evidence measured "74.9 KiB full gzip") is **7,894 B ≈ 7.7 KiB** — about 3.9% of budget |
| Content correctness | Verified directly in the built output: release section correctly absent (empty collection), shows fallback copy correctly renders (empty collection), 2 pending action cards (Listen/Buy), enter-card resolves to `/`, footer mail resolves to the real booking address, 3 social chips render with correct hrefs |
| Reduced motion | No local rule needed — the global `@media (prefers-reduced-motion: reduce)` block (imported via `BaseLayout` → `global.css`) already suppresses `animation-duration`/`transition-duration` universally, covering every hover transition on this page without duplication |
| Keyboard focus | `a:focus-visible { outline: 3px solid var(--link-ink); outline-offset: 4px; }` ported unchanged from the approved E1 design |

## Code review

An independent `code-reviewer` sub-agent reviewed `src/pages/link.astro` after the verification pass above. It found three real issues, all fixed in the file before this evidence was finalized:

1. **Duplicate skip-link.** The route rendered its own `<a class="skip-link">` in addition to the one `BaseLayout` already emits, so keyboard/AT users landed on two identical skip targets. Removed the route's own copy — `BaseLayout`'s is the single source, consistent with every other page.
2. **Disabled social links silently disappeared instead of showing pending state.** `socialLinks.map` only handled the enabled case; a disabled social entry rendered nothing at all, rather than the pending-chip treatment every other content type on this page (Listen/Buy action cards, show tickets) already gets for an unset destination. Restored the pending branch (`.social-chip--pending`, `role="img"`, `aria-label` reading "— link pending"), matching the pattern already established elsewhere on the page.
3. **`.release-card` grid would collapse when a release has no artwork.** `release.data.artwork` is optional and the `<img>` is conditionally omitted, but the grid (`minmax(6.4rem, 35%) 1fr`) assumed two children were always present; with only `.release-card__copy` present it auto-placed into the narrow art-sized column instead of spanning the row. Added `.release-card__copy:only-child { grid-column: 1 / -1; }`.

A fourth, smaller hardening was applied alongside the review findings: `socialMark()` now uses `Object.hasOwn(SOCIAL_MARKS, label)` instead of `SOCIAL_MARKS[label]`, so a social link labeled to collide with an inherited `Object.prototype` key (e.g. `"constructor"`) can't resolve through the prototype chain into `set:html`.

Both content-shaped fixes (findings 2 and 3) were verified against throwaway fixtures — a `links` entry with `kind: "social", enabled: false` and a `releases` entry with no `artwork` — confirmed correct in the rebuilt `dist/client/link/index.html`, then the fixtures were deleted. Post-cleanup, `npm run check` (0/0/0, 3/3 tests) and `npm run build` were re-run clean; the rebuilt `dist/client/link/index.html` has exactly one skip-link anchor (`BaseLayout`'s — the other two `skip-link` substring matches are its CSS rules), 0 `<script>` tags, and `src/content/releases` / `src/content/links` contain only real content, no fixture leftovers.

## Outstanding

Closed 2026-08-07: the 375×812 / 768×1024 / 1440×900 captures and keyboard-focus pass. Evidence: `references/checkpoint-3-captures/`, script: `e2e/checkpoint-3-evidence.spec.ts`. Compared against the approved E1 mock captures (`references/link-preview-evidence/`) at all three viewports — layout, spacing, and type match; the only differences are the expected content-driven ones already documented above (3 real social icons vs. E1's 5-icon mock, real copy). Keyboard tab order: 7 stops, all with a visible focus ring and an accessible name.

**Closed 2026-08-07 (human-approved):** the delivered preview URL. `solbo-astro7-cloudflare` had never been deployed, so `wrangler versions upload` (Task 1.2's pattern) failed with "Worker does not yet exist" — an initial `wrangler deploy` was required instead, human-approved separately since it's a different command than a version upload. `workers_dev: false` and no `routes` in `wrangler.jsonc`, so this attached to no live domain — same isolated no-route pattern as Task 1.1. Cloudflare's version-preview subdomain came up regardless (`preview_urls: true`), giving a real URL without needing `workers_dev`. Verified live:

- `https://9b3b6305-solbo-astro7-cloudflare.nickgagne92.workers.dev/` — HTTP 200, `<title>Sölbo</title>`
- `https://9b3b6305-solbo-astro7-cloudflare.nickgagne92.workers.dev/link/` — HTTP 200, `<title>Sölbo — Links</title>` (`/link` redirects 307 to the trailing-slash form, standard Astro behavior)
