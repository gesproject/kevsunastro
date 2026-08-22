# Task 4.3 subsection — Shows timeline

**Implemented and human-approved 2026-08-17.**

## Scope

The legacy Shows section used a 250% desktop ScrollTrigger pin: its heading
wiped in, the event panel entered, the photo drifted with the page, and the
photo panel tilted on pointer movement. The mobile section did not pin and
used simple viewport entrances. Existing show rows also flickered after an
idle delay and scrambled their date, venue, and city fields on hover.

`src/lib/motion/showsTimeline.ts` ports those behaviors through the existing
route-scoped Lenis/GSAP/ScrollTrigger lifecycle. It adds no dependency,
second Lenis instance, or ticker. The module reverts on `pagehide` and
rebuilds after a bfcache restore.

The user explicitly restored the Vercel five-row fallback, including its 2025
sample dates and `example.com` ticket links, then approved the Signal Board
visual treatment. Content records in `src/content/shows/` still take
precedence, so Task 5.2 replaces the fallback automatically. With either
source present, the original scroll-driven exit and row atmosphere activate.

The Astro markup is visible by default. Entrance states are applied only when
the motion lifecycle is active, so no-JavaScript and reduced-motion paths
remain readable and use native scrolling.

## Verification

| Check | Result |
| --- | --- |
| `npm run check` | 0 errors, 0 warnings, 0 hints; 3/3 unit tests pass |
| `npm run build` | Cloudflare server build passes |
| Combined Music + Shows suites | `e2e/task-4.3-{music,shows}-timeline.spec.ts`: 9/9 pass |
| Desktop behavior | 250% Shows pin, heading/panel reveal, parallax, and pointer tilt pass; resize/reload retain one Shows pin spacer |
| Mobile behavior | No pin; heading and five-row Signal Board enter; the exit seam remains scroll-driven |
| Accessibility | Reduced motion stays static; `/#shows` and focused `PageDown` remain usable |
| No JavaScript | Static Shows heading, all five rows, and the legacy ticket link are present |
| Public React | None added; the public page remains Astro-first |

Responsive capture evidence:

- `references/task-4.3-shows-timeline/desktop-1440x900.png`
- `references/task-4.3-shows-timeline/tablet-768x1024.png`
- `references/task-4.3-shows-timeline/mobile-375x812.png`
- `references/task-4.3-shows-timeline/desktop-1440x900-reduced-motion.png`

## Approval gate

Shows was human-approved before Footer began.
