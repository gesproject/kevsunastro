# Task 0.2 - Visual and interaction contract

**Captured:** 2026-07-22
**Reference app:** current Next.js production build at local loopback only (`next start`, HTTP 200). No Vercel, Supabase, configuration, or deployment action occurred.

## Reference evidence

All stills use Chromium's installed Chrome channel at device scale factor 1. The initial tablet and desktop stills intentionally retain the current five-bar Hero loading state; the ready/scrub still captures the loaded canvas state separately.

| Reference | Evidence |
| --- | --- |
| Mobile, 375 x 812 | [landing](references/task-0.2-production/mobile-375x812-landing.png), [first keyboard focus](references/task-0.2-production/mobile-375x812-first-focus.png) |
| Tablet, 768 x 1024 | [initial Hero/loading](references/task-0.2-production/tablet-768x1024-hero.png) |
| Desktop, 1440 x 900 | [initial Hero/loading](references/task-0.2-production/desktop-1440x900-hero.png), [ready Hero scrub](references/task-0.2-production/desktop-1440x900-hero-ready-scrub.png), [full-page reference](references/task-0.2-production/desktop-1440x900-full-page.png) |
| Reduced motion, 375 x 812 | [entry result](references/task-0.2-production/mobile-375x812-reduced-motion-entry.png); browser media query was `true`, response was HTTP 200, and entry landed at `scrollY=883` |
| Section states | [Music](references/task-0.2-production/desktop-1440x900-music.png), [Shows](references/task-0.2-production/desktop-1440x900-shows.png), [Footer](references/task-0.2-production/desktop-1440x900-footer.png) |
| Motion record | [desktop scroll, 1440 x 900](references/task-0.2-production/desktop-1440x900-scroll.webm) (381,153 bytes; SHA-256 `DAD82D252F5F29C2F8CC7692A0DB66F2842F3DF63AB3CB33E571C1BBC4305CA7`) |

The direct-target Music/Shows stills are retained even where the current pinned/loading geometry leaves a sparse frame. The full-page reference and scroll recording are the canonical evidence for their seam and scroll relationship.

## DOM and content order

Preserve this public order and landmarks:

```text
main
|- #hero    Hero
|- #music   Music
`- div      MusicFooterShell (shader/background owner)
   |- #shows  Shows
   `- #footer Footer
```

- Hero contains the sole `h1`, social navigation, canvas, loading state, desktop lockup, and the mobile link-tree/entry affordance.
- Music contains player embeds, social links, and releases.
- Shows contains the `Find me live.` heading and show list; desktop adds the editorial performance image.
- Footer contains booking email, social links, copyright, oversized Sölbo watermark, and the interactive wave field.

## Responsive and visual contract

| Area | 375 x 812 | 768 x 1024 | 1440 x 900 |
| --- | --- | --- | --- |
| Hero | Grey link-tree landing: portrait, five social icons, Mecca Spotify card, and a dark `See website` control. | Desktop CSS treatment is active, including the canvas/loading visual and vertical `Scroll` cue. | Grey cinematic field with image sequence confined to the right side; after scrub, large black Sölbo lockup and social pill sit bottom-left. |
| Canvas/masking | Full-width canvas behind the mobile landing; the mobile mask/vignette darkens the lower part. | Right-side desktop canvas width/style applies. | Right-side canvas with horizontal fade; bottom vignette resolves it into the grey Hero field. |
| Music | Stacked/reversed content, full-bleed editorial image and dark gradient; release grid remains three columns. | Desktop two-column layout begins. | Players left; releases right; dark shader shell and long transition toward Shows. |
| Shows | City column and desktop photo panel are omitted. | Desktop show-card/photo treatment begins. | Two columns: glass show table left, sticky monochrome performance image right. |
| Footer | Vertical cropped Sölbo watermark at left. | Desktop layout begins. | Large horizontal cropped watermark, booking block at upper right, social/copyright row, and full interactive waves. |

### Exact 768px boundary - approved correction (2026-07-22)

The human approved Tailwind `md` as the Hero boundary. The mobile Linktree entry and its pre-entry wheel/touch/navigation-key lock apply through 767px only; 768px and above use the desktop path with no hidden-control lock. The lock now responds to a 767/768 resize without duplicate handlers, and `See website` is single-run for click, tap, and keyboard activation. This correction does not alter the 193-frame loading pipeline.

Post-correction local production verification passed: 375px blocks the intended inputs before entry; 768px and 1440px do not; 767px to 768px resize toggles the lock correctly; normal and reduced-motion double activation each enter once (`scrollY=883`, one reduced-motion `scrollTo` call); and no page errors occurred. `npm run build` passed before this check.

## Interaction inventory

| Area | Current behavior to match before any intentional change |
| --- | --- |
| Hero load and canvas | Preloads 193 JPEG frames; a five-bar loader remains until all frames are ready. The 2D canvas redraws the selected frame at resize/DPR-aware dimensions. The ready Hero screenshot documents the visible scrub state. |
| Hero entry lock | Through 767px, wheel, touchmove, and navigation keys are prevented before entry. `See website` is the only gate and is single-run; normal motion fades the link-tree and scrolls through the Hero, while reduced motion draws the final frame and uses an immediate scroll. At 768px and above no pre-entry lock is installed. |
| Hero scrub/seam | GSAP ScrollTrigger drives frame selection, Hero lockup, scroll cue, canvas melt, and the hand-off from grey Hero into Music. The scroll cue persists longer than the lockup. |
| Smooth scroll | Lenis drives scroll and updates ScrollTrigger except when `prefers-reduced-motion: reduce` is true. |
| Music | ScrollTrigger reveals the player card, heading, and release rows; desktop uses lazy Spotify/SoundCloud iframes with in-page fallback player states when a usable embed URL is absent. Player/social/release-art hover changes are opacity/scale treatments. |
| Shows | ScrollTrigger reveals heading/list and controls the section exit seam. Desktop keeps a sticky image panel with parallax/tilt response; show rows dim non-active entries and run an idle sweep after inactivity. Ticket links open in a new tab; sold-out/free states remain textual badges. |
| Footer | ScrollTrigger reveals booking and links. The footer wave layer is an SVG path field with continuous `requestAnimationFrame` noise and mouse/touch displacement; the parent shell owns the MeshGradient shader background. Booking/social hover raises opacity. |
| Loading/failure states | The captured Hero loader is the current readiness gate. Player frames are lazy. Placeholder music/ticket URLs and local mock fallback remain existing content states, not migration data. |

## Accessibility and input baseline

- Semantic anchors, `main`, a social `nav`, section IDs, the Hero `h1`, section `h2`s, titled player iframes, image alt text, and a list role for shows are present.
- The first mobile `Tab` focuses the Spotify social link; computed outline is browser `auto`, captured in the focus still. No custom global focus-visible rule was observed.
- Reduced motion disables Lenis and changes Hero entry to the immediate final-frame path. The footer waves themselves do not currently have a reduced-motion branch; preserve this as a known current behavior for Task 4.5 review.
- Verify keyboard entry, focus order, external-link behavior, and player fallback again during human review. The 768px boundary correction is user-approved; its post-change checks are recorded with this task.

## Human approval — approved (2026-07-25)

The human approved this recorded contract as-is after reviewing the available reference pack. The known sparse Music/pin evidence, Hero all-frame readiness, default focus ring, continuously animated footer waves, and other documented motion/accessibility gaps remain approved parity exceptions for later migration review; this approval authorizes no production, infrastructure, or feature changes.

## Ponytail / scope review

Ponytail's review skill is not exposed here, so the codex-loop manual YAGNI ladder was applied:

1. The contract and reference evidence are required by Task 0.2.
2. The existing locked dependency set, local Next build, installed Chrome, and Playwright CLI/API were sufficient.
3. No source package, service, CMS, or new abstraction was added.
4. One contract and only its direct reference artifacts are the smallest safe evidence slice.
5. Only the approved Hero-entry correction and its contract disposition were added; no migration implementation was performed.

Rollback remains the separate current Next.js/Vercel/Supabase path; it was not changed.
