# Task 3.2 — Port Shows: evidence

**Date:** 2026-08-06
**Branch:** `migration/astro-7-cloudflare`
**Legacy source ported:** `Kev.Sun/components/sections/Shows.tsx` and `Kev.Sun/components/ui/shows-list.tsx` (read-only reference; unchanged)

## What shipped

| Artifact | Role |
|---|---|
| `src/components/Shows.astro` | Section markup and scoped vanilla CSS. Zero client JavaScript. |
| `src/pages/index.astro` | Mounts `<Shows />` after `<Music />`. |

Ported: the "Find me live." header, the show list (date, venue, city, and a ticket link / Sold Out badge / Free badge per row), the desktop-only editorial photo panel with its vignette, and the mobile/desktop layout switch at 768px. Uses the existing `getShows()` build-time accessor and `showSchema` — no new content-layer code.

Deferred by design to Task 4.3, same convention as `Music.astro`: the pinned GSAP scroll timeline, header clip-path wipe, photo-panel pointer-driven 3D tilt, per-row text-scramble-on-hover, and the idle flicker animation. The ticket link's hover/active state is substituted with real CSS `:hover`/`:focus-visible` — zero script, same visual intent as the legacy JS-driven state.

## Deliberate deviation from the legacy structure

Legacy rendered the entire show list **twice** in the DOM — once per breakpoint, toggled with `hidden md:block` / `block md:hidden` — purely to get a different `grid-template-columns` and desktop-only glass-panel chrome. This port renders the list **once** and adapts both via a media query (a `.shows__cell--city` utility toggles the city column; the desktop breakpoint adds the glass panel). Screen readers and view-source get one copy of the content instead of two.

## Verification

Toolchain pinned to Node 22.12.0 / npm 10.9.0 throughout.

| Check | Result |
|---|---|
| `npm run check` | 0 errors, 0 warnings, 0 hints (10 files) + 3/3 tests |
| `npm run build` | Passed; Cloudflare Worker output plus prerendered `/` |
| React runtime on the public route | 0 `<script>` tags in `dist/client/index.html` |
| Content-driven logic | Verified against three temporary fixture files (available+ticketUrl, sold-out, free) covering every `status` branch and the priority sort — confirmed correct rendering, then deleted; `shows/` holds only `.gitkeep` again |
| Empty state | `shows/` is empty by design until Task 5.2; "Shows are on the way." renders as expected |

## Bug found and fixed during this task (self-caught, before review)

Ported the resting-state opacities from the legacy `isActive ? active : resting` ternaries in `shows-list.tsx`, but on the first pass placed the **active** values at the mobile/base CSS scope and the **resting** values only inside the desktop media query — backwards, and only surfaced because the resting/active pair is identical at both legacy breakpoints. Corrected: `date` 0.35, `venue` 0.85, `city` 0.22, `ticket` 0.5 now sit at the single base rule with no per-breakpoint duplicate. Re-verified against `shows-list.tsx` line by line after the fix.

## Code review

`/ponytail-review` plus an independent `code-reviewer` sub-agent pass. Verdict REQUEST CHANGES on two Important findings, both fixed and re-verified.

1. **Accessibility regression.** The column-header row (`Date` / `Venue` / `City` labels) had `aria-hidden="true"`, stripping real informational text from the accessibility tree. Unlike the section's other `aria-hidden` uses (`.shows__seam`, `.shows__vignette` — genuinely decorative), these are the only labels a screen-reader user would get for each row's fields. Legacy never hid this text either. Removed the attribute; the row is now exposed as plain inert text, matching or exceeding legacy.

2. **Dead-code bug, same shape as the opacity mistake I'd already self-corrected.** The desktop media query set `.shows__row--head span { font-size: 0.5rem; }`, overriding the base `0.58rem`. Traced to `shows-list.tsx:245`: `fontSize: light ? "0.58rem" : "0.5rem"` — keyed on the `light` theme prop, not on breakpoint, and `light` is passed unconditionally at both call sites in `Shows.tsx`. `0.5rem` is dead code for a dark theme variant that's never instantiated. Deleted the override; `0.58rem` now applies everywhere, consistent with how `.shows__date`/`.shows__venue`/`.shows__city` already had no breakpoint override.

The reviewer independently re-derived all five legacy opacity ternaries (date 0.35, venue 0.85, city 0.22, ticket 0.5, badge 0.35) against `shows-list.tsx` and confirmed the self-caught fix from the implementation phase is correct. Also confirmed: the single-render-plus-media-query strategy correctly reproduces both legacy layouts (CSS Grid cleanly drops a `display: none` item from placement, so the 3-column mobile and 4-column desktop templates both apply to the same markup); the ticket/sold-out/free branching is logically exhaustive given the schema's `superRefine` guarantee; zero client JavaScript; `ticketUrl` constrained to `https:` only, no `set:html`, `rel="noopener noreferrer"` present.

One Suggestion, not changed: the ticket link's `:hover` uses a flat 8%-white overlay rather than legacy's exact `rgb(55 65 81 / 0.8)` + border-color swap. Left as-is — design decision #2 already frames the CSS-native hover as an approximation of the JS-driven active state, and Task 4.3 owns final motion/hover fidelity.

## Outstanding

Closed 2026-08-07: viewport captures (375×812/768×1024/1440×900) and the keyboard-focus pass, previously blocked on no browser being available. Evidence: `references/checkpoint-3-captures/`, script: `e2e/checkpoint-3-evidence.spec.ts`. The desktop-only photo panel (shared component, not this section) initially rendered blank in the fullPage capture — traced to a Playwright screenshot-timing quirk with off-screen `position: sticky` content, fixed in the capture script; confirmed the live page renders correctly. No parity defect found in Shows itself.
