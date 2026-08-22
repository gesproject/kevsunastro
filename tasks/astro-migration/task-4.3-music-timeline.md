# Task 4.3 subsection — Music timeline

**Implemented and human-approved 2026-08-17.**

## Scope

The legacy Music section used a 120% desktop ScrollTrigger pin to scrub in
the player card, platform links, Releases heading, and release tiles. On
mobile it did not pin; it revealed the same content on viewport entry.

`src/lib/motion/musicTimeline.ts` ports that behavior through the existing
route-scoped Lenis/GSAP/ScrollTrigger lifecycle. It uses no new dependency or
second ticker, retains the approved moss backdrop and Hero-to-Music CSS push,
and cleans itself up on `pagehide` before rebuilding on bfcache restore.

The Astro markup is visible by default. The timeline only assigns entrance
states after `initMotionLifecycle()` activates, so no-JavaScript and
reduced-motion paths remain native, readable content.

## Verification

| Check | Result |
| --- | --- |
| `npm run check` | 0 errors, 0 warnings, 0 hints; 3/3 unit tests pass |
| `npm run build` | Cloudflare server build passes |
| Timeline browser suite | `e2e/task-4.3-music-timeline.spec.ts`: 4/4 pass |
| Existing Music backdrop suite | `e2e/task-4.3-music-backdrop.spec.ts`: 5/5 pass |
| Desktop behavior | 120% pin and scrub complete; resize and reload retain one pin spacer |
| Mobile behavior | No pin; player card enters normally |
| Accessibility | Reduced motion stays static; `/#music` and focused `PageDown` remain usable |
| Public React | None added; the page continues to use the existing Astro-first motion bundle |

Responsive capture evidence:

- `references/task-4.3-music-timeline/desktop-1440x900.png`
- `references/task-4.3-music-timeline/tablet-768x1024.png`
- `references/task-4.3-music-timeline/mobile-375x812.png`
- `references/task-4.3-music-timeline/desktop-1440x900-reduced-motion.png`

## Approval gate

Music was human-approved before Shows began. Footer remains gated on the
separate Shows approval.
