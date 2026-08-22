# Task 4.3 subsection — Footer timeline

**Implemented and human-approved 2026-08-17.**

## Scope

The legacy Footer staggered its booking block and platform links once on
desktop entry. On mobile, the whole content block rose into place as the
Footer entered the viewport. It did not pin. Its interactive wave field is
separate Task 4.4 work and remains untouched here.

`src/lib/motion/footerTimeline.ts` ports those two branches through the
existing route-scoped Lenis/GSAP/ScrollTrigger lifecycle. It adds no
dependency, second Lenis instance, or ticker, and reverts on `pagehide`
before rebuilding on bfcache restore. The breakpoint matches the Footer's
existing 768px CSS boundary rather than the legacy timeline's conflicting
769px cutoff.

The mobile reference's `top 30%` end position was unreachable: Footer is the
last 44vh section, so scroll ends while its top is still at roughly 56% of
the viewport and content remained at 48% opacity. Its endpoint is therefore
`bottom bottom`, which resolves the same entrance exactly at the natural
document end without adding height or a pin.

The Astro markup remains visible by default. Entrance states are assigned only
after the motion lifecycle activates, preserving readable no-JavaScript and
reduced-motion paths.

## Verification

| Check | Result |
| --- | --- |
| `npm run check` | 0 errors, 0 warnings, 0 hints; 3/3 unit tests pass |
| `npm run build` | Cloudflare server build passes |
| Combined timelines | Music, Shows, and Footer suites: 14/14 pass |
| Music backdrop regression | 5/5 pass |
| Desktop + tablet | Booking/link stagger completes without a pin; the 768px layout and animation boundary agree |
| Mobile | Footer content scrubs to full opacity at document end, without a pin |
| Accessibility | Reduced motion stays static; `/#footer` and focused `PageUp` remain usable |
| No JavaScript | Booking and social-link content are present |
| Public React | None added; no emitted page-script React marker |

Responsive capture evidence:

- `references/task-4.3-footer-timeline/desktop-1440x900.png`
- `references/task-4.3-footer-timeline/tablet-768x1024.png`
- `references/task-4.3-footer-timeline/mobile-375x812.png`
- `references/task-4.3-footer-timeline/desktop-1440x900-reduced-motion.png`

## Approval gate

Footer was human-approved as the final section timeline subsection.
