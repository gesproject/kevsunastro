# Task 3.1 — Port Music: evidence

**Date:** 2026-08-06
**Branch:** `migration/astro-7-cloudflare`
**Legacy source ported:** `Kev.Sun/components/sections/Music.tsx` (read-only reference; unchanged)

## What shipped

| Artifact | Role |
|---|---|
| `src/components/Music.astro` | Section markup and scoped vanilla CSS. Zero client JavaScript. |
| `src/lib/embeds.ts` | Spotify/SoundCloud embed URL construction with host validation. |
| `src/lib/embeds.test.mjs` | Unit check for the above. |
| `src/pages/index.astro` | Mounts `<Music />`. |

Ported: the Spotify and SoundCloud player cards with their static fallbacks, the release grid, the platform-link row, the mobile full-bleed background, the desktop seam gradient, and the mobile/desktop layout switch at 768px.

Deferred by design to Task 4.3: ScrollTrigger reveals, the Hero→Music colour-grade seam animation, and hover motion. Nothing in this section starts at `opacity: 0`, unlike the legacy React version — the section is fully readable before any script runs.

## Verification

Toolchain pinned to the `engines` values for every command below: Node 22.12.0, npm 10.9.0.

| Check | Result |
|---|---|
| `npm run check` | 0 errors, 0 warnings, 0 hints (9 files) |
| `npm run build` | Passed; Cloudflare Worker output plus prerendered `/` |
| `npm test` | 2 tests, 2 pass |
| React runtime on the public route | **0 `<script>` tags** in `dist/client/index.html`; the only referenced asset is `/_astro/index.*.css` |
| No-JavaScript path | Satisfied by the above — the route ships no script at all, so there is no JS-dependent content |
| Emitted page weight | `index.html` 10,325 B, CSS 11,886 B |
| Markup present pre-script | Both fallback players, 50 waveform bars, 5 platform links (3 live, 2 pending), and the releases empty state all present in the prerendered HTML |
| Dev route | `http://localhost:4321/` returns 200 with the section (dev-only HMR scripts are not in the production build) |

`@astrojs/react` remains installed for Keystatic's later admin UI. Its client bundle (`dist/client/_astro/client.*.js`, ~192 KB) is emitted but **not referenced by the public route**. Removing it from the deployed asset set belongs to Task 6.1/6.2.

## Parity notes

Reconciled to match the legacy component during this task: scrubber height (4px), waveform height (40px mobile / 48px desktop) and gap, play-button sizes (36→44px Spotify, 32→40px SoundCloud), and the platform-link row hidden below 768px as the legacy `hidden md:flex` did.

Recorded intentional exceptions:

1. **Colours snap to the Task 2.2 tokens.** Legacy literals `#c8cbc8` / `#0e0e0c` differ from `--color-paper` / `--color-ink` by under two levels per channel. Annotated in the component.
2. **Spacing uses the Task 2.2 scale** rather than the legacy Tailwind literals (`px-5 md:px-16 lg:px-24`).
3. **Platform links are content-driven.** Legacy hardcoded five entries, two of which (`Resident Advisor`, `Bandcamp`) pointed at `#`. The port renders the validated `links` collection, so unconfigured destinations become non-interactive `pending` labels instead of dead links — the same pattern the approved `/link` preview uses.
4. **Player artwork uses `alt=""`.** The track title and artist sit adjacent as real text, so the image is decorative; the legacy `alt="Mecca by Sölbo"` duplicated it for screen readers.
5. **Platform-link hover is CSS.** The legacy inline handlers returned to `0.32` on mouse-leave despite a `0.4` resting state; the port uses a single `0.4 ↔ 0.9` transition and works on keyboard focus too.

## Code review

`/ponytail-review` plus an independent `code-reviewer` sub-agent pass. The reviewer returned REQUEST CHANGES on one critical finding, since fixed and proven fixed.

**Critical — stored XSS through CMS-authored `href`.** `linkHref` used `z.url()`, which validates URL *shape* but not scheme. Independently reproduced:

```
ACCEPT  javascript:alert(1)
ACCEPT  data:text/html,<script>alert(1)</script>
ACCEPT  vbscript:msgbox(1)
```

A Keystatic editor could therefore write a `javascript:` URL into a link record and have it render verbatim into `<a href>` and execute in-origin. Astro's escaping does not help — the payload contains no quotes or angle brackets. Fixed at `src/content/schemas.ts` with a `withScheme()` allowlist rather than a guard at the render site, because `ticketUrl`, `spotifyUrl`, `soundcloudUrl`, `bandcampUrl`, and `youtubeUrl` all parsed through the same unguarded `externalUrl`. External URLs are now `https:` only; `linkHref` additionally allows `mailto:` (booking) and the literal `/`. Covered by a new test.

Also fixed from the review, each independently verified:

- Spotify locale URLs (`/intl-de/track/…`) — the format Spotify's own share button emits — silently fell back instead of embedding.
- The ID pattern `[A-Za-z0-9]+` accepted the literal `placeholder`, producing a broken embed where the legacy code had an explicit guard. Now `{22}`, matching real base62 IDs.
- The SoundCloud widget URL was built from `parsed.toString()`, forwarding userinfo, query, and hash to the third party; and subdomains passed through, so `w.soundcloud.com` nested the player inside itself. Both closed by rebuilding from origin + pathname on the canonical host.
- `npm run check` now runs the tests too. They were the only guard on a trust boundary and nothing invoked them automatically.
- Release artwork now uses `alt=""`; the visible title sits directly beneath it, so the old value was announced twice.
- The platform-row content substitution is now annotated in the component.

**Deferred with a `ponytail:` marker, not silently dropped:** once Task 5.2 supplies real release URLs, the iframe replaces the static card and renders as an empty box with JavaScript disabled — breaking the Phase 3 no-JS bar. The branch is unreachable today (both collections are empty), so the marker in `Music.astro` names the ceiling and the upgrade path. **This must close before Checkpoint 3 sign-off.**

**Referred to the human, not changed unilaterally:** the reviewer measured desktop text below WCAG AA — platform links ≈2.3:1 at `opacity: 0.4`, pending labels ≈1.8:1, and `.release__meta span` ≈2.25:1 where a nested `0.6` compounds to `0.36`. All three are inherited from the legacy design and fall under the motion/accessibility gaps already approved as parity exceptions at Checkpoint 0 (`todo.md`, Task 0.2). Fixing them changes approved visuals, so it needs a decision rather than a quiet edit.

Also referred: `clamp()` replaced the legacy breakpoint steps, leaving some elements materially smaller in the 768–1200px band (fallback artwork ~69px at 768px where legacy gave 112px). This is exactly what the outstanding viewport captures would expose.

## Fixed during this task

- **Focus indicator failed WCAG 1.4.11 on this section.** The global ring is `--color-paper-bright` (`#f2f2ef`), which sits at roughly **1.4:1** against the Music desktop field `--color-paper` (`#cacaca`) — the platform links are the only focusable elements there, so their focus state was effectively invisible. Fixed at the shared rule rather than per-section: `global.css` now defines a `--focus-ring` token that `:focus-visible` reads, and `.music` overrides it to `--color-ink` above 768px (~12:1). Every later light-background section inherits the same mechanism instead of repeating a `:focus-visible` override.
- `package.json` `test` script lacked `--experimental-strip-types`. It imports a `.ts` module, which the pinned Node 22.12.0 cannot load without the flag — the test only passed on an unpinned newer Node. Root-cause fix in the shared script, so every caller gets it.
- Removed an unstyled `.music__players` wrapper element that had no CSS rule and no other reference, leaving `.music__stack` as the direct grid child (which is what the legacy component had).

## Toolchain note

Node is not on `PATH` at the pinned version in this environment; the shell defaults to Node 25. Every command above was run with the pinned interpreter prepended:

```
$env:PATH="C:\Users\Chance\AppData\Roaming\fnm\node-versions\v22.12.0\installation;"+$env:PATH
```

`node_modules/.bin` was also missing on arrival, so `npm ci` was re-run against the committed lockfile before any verification.

## Outstanding

- ~~Viewport captures at 375×812, 768×1024, and 1440×900, plus the keyboard-focus pass, are not yet recorded.~~ **Closed 2026-08-07.** Playwright + `wrangler dev` captured all three viewports, a reduced-motion pass, and the full keyboard tab order for `/`; every focusable element has a visible focus ring and an accessible name. Evidence: `references/checkpoint-3-captures/`, script: `e2e/checkpoint-3-evidence.spec.ts`. No parity defect found against the Task 0.2 baseline.
- The Task 5.2-gated `ponytail:` marker (line 72 above) and the WCAG AA contrast decision referred to the human are unrelated to the browser gap and remain open, carried at the Checkpoint 3 gate in `todo.md`.
