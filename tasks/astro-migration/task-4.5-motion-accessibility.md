# Task 4.5 — Motion accessibility QA

**Complete 2026-08-22; Checkpoint 4 approval is still required.**

## Outcome

The cinematic enhancements now preserve every native path: a motion-reduced
visit is a readable, unpinned document; a JavaScript-free visit keeps all
content and links; keyboard focus reaches every homepage link; and a bfcache
restore reinitializes motion without moving the visitor.

The audit found one real accessibility defect. GSAP's `autoAlpha` makes an
element `visibility: hidden` before its entrance, removing future Music,
Shows, and Footer links from sequential keyboard navigation. Their entrance
tweens now animate `opacity` instead. The visual fade and translation are
unchanged, while the native browser can move focus to a link and scroll it
into its owning section. Section-scoped `:focus-within` rules then override
any unfinished entrance state until focus leaves, so the focused link and its
ring are actually painted rather than merely present in the tab order.

The Hero geometry test was also made resilient to the existing desktop Music
pin: ScrollTrigger transfers Music's overlap margin to its generated pin
spacer, so the test now observes the layout-owning element. The return-state
assertion waits for the deliberate scrub to settle before checking opacity.

## Reduced-motion alternatives

| Enhancement | Reduced-motion behavior |
| --- | --- |
| Lenis, pins, entrances, and Hero scroll sequence | `initMotionLifecycle()` marks the document `reduced` and starts none of them; the Hero is a normal 100svh section and native scrolling remains available. |
| Hero footage and opening handoff | One settled final frame; no scrub runway or automatic handoff. |
| Music, Shows, and Footer reveals | Static, fully opaque content with no pins or entrance state. |
| Film grain and CSS animation | Global reduced-motion CSS collapses animation and transition duration. |
| Hero, Music, `/link` shaders and Footer waves | One static canvas draw, with no animation loop. |

`src/styles/global.css` supplies the shared 2px, 4px-offset focus ring. It
inherits an ink or paper token from the current section, documented there as
maintaining the required 3:1 indicator contrast. The focused browser pass
asserts that every homepage link has an accessible name, lands in the viewport,
and exposes that outline.

## Verification

| Check | Result |
| --- | --- |
| Focus and restore coverage | New `e2e/task-4.5-motion-accessibility.spec.ts`: 2/2 pass. |
| Full motion/accessibility regression | 58/58 Chromium checks pass against a freshly built Cloudflare Worker. Covers Hero failure/reduced-motion/no-JS, auto-intro input cancellation, Music/Shows/Footer pins and keyboard paging, shader/wave hidden-tab and reduced-motion handling, and readable no-JS content. |
| Hero layout regression | `e2e/task-4.2-hero-sequence.spec.ts`: 9/9 pass. |
| `npm run check` | 0 errors, 0 warnings, 0 hints; 3/3 unit tests pass. |
| `npm run build` | Astro Cloudflare server build passes. |
| Public runtime audit | The emitted homepage has three purpose-built scripts (Hero backdrop, Music backdrop, homepage motion) and zero `react`, `react-dom`, or `preact` markers. |

The only build notices are expected empty `shows` and `releases` CMS
collections; their approved static fallbacks remain covered by the no-JS
tests.

## Approval gate

Task 4.5 is implemented, tested, and documented. Do not begin Phase 5 until
the human explicitly approves Checkpoint 4 motion and accessibility parity.
