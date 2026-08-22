# Task 3.2 amendment — Shows Signal Board

**Implemented 2026-08-22; user-directed.**

## Decision

The user selected the Signal Board direction for the Shows section: large
date markers, venue-first rows, compact status stamps, and a low-contrast grid
within the existing dark glass/photo composition.

## Implementation

`src/components/Shows.astro` renders the user-approved five-row legacy Vercel
fallback when there are no CMS show records. Real `src/content/shows/` records
always take precedence, so Task 5.2 replaces the temporary fallback without a
design or rendering change. The board is native Astro markup and CSS; no
dependency, React island, or additional animation loop was added.

`showsTimeline.ts` now scrambles the date numeral rather than replacing the
date's structured month/year markup on hover.

## Verification

| Check | Result |
| --- | --- |
| `npm run check` | 0 errors, 0 warnings, 0 hints; 3/3 unit tests pass |
| `npm run build` | Cloudflare server build passes |
| Shows browser suite | `e2e/task-4.3-shows-timeline.spec.ts`: 5/5 pass |
| Desktop, tablet, mobile | Fresh 1440x900, 768x1024, and 375x812 captures reviewed |
| Motion and accessibility | Desktop pin/tilt, mobile native scroll, reduced motion, keyboard paging, and no-JavaScript content pass |
| Public route | No public React added |

Capture evidence:

- `references/task-4.3-shows-timeline/desktop-1440x900.png`
- `references/task-4.3-shows-timeline/tablet-768x1024.png`
- `references/task-4.3-shows-timeline/mobile-375x812.png`
- `references/task-4.3-shows-timeline/desktop-1440x900-reduced-motion.png`
