# Task 4.3 amendment — Music section shader backdrop

**Human-directed 2026-08-08.** Unplanned work layered on top of the active Task 4.3
(port section timelines): brings a bold, animated shader background to the Music
section, matching the same design-system energy just approved for `/link`'s Plasma
restyle (Task 3.6 amendment). Task 4.3's own acceptance criteria (scroll-triggered
reveal timelines, the Hero→Music colour-grade seam) are unchanged and not yet
started — this amendment is scoped to the backdrop only, at the human's explicit
direction, with the Hero→Music transition deliberately deferred to a later pass.

## Constraint this session ran under

A separate, concurrent Claude Code session was active on `Hero.astro`,
`HeroBackdrop.astro`, `HeroSocialNav.astro`, and `src/lib/motion/heroSequence.ts` in
the same working tree throughout this work — all uncommitted. Every one of those
files was left untouched; `index.astro` (which their Hero wiring also touches) was
avoided too, so Music's own script tag is self-contained in `Music.astro` rather
than routed through the page-level script index.astro already carries. The shared
dev server this session tested against died or became unresponsive repeatedly
during the session (a `workerd` native-binary crash, an IPv6-only bind mismatch,
several plain disconnects) — traced to that concurrent session's own build/dev
cycles competing for the same port and `dist/` output, not to anything in this
diff. Confirmed by direct inspection each time, not assumed.

## What shipped

- `src/lib/motion/shaderField.ts` (new) — the WebGL1 engine extracted out of
  `PlasmaBackdrop.astro`'s former inline script: compile/link, DPR-capped resize,
  rAF draw loop, hidden-tab pause, reduced-motion frozen-frame path, and a
  `setVisible()`/`dispose()` pair for section-scoped mounts. Shader-agnostic —
  takes a `ShaderDefinition` (fragment source + uniform values) as a parameter,
  so `/link`'s Plasma backdrop and Music's new backdrop share 100% of the
  compile/draw/pause plumbing and carry zero duplicated WebGL boilerplate,
  despite running different shaders.
- `src/lib/motion/shaders/plasma.ts` (new) — the exact `/link` shader and uniform
  values that used to live inline, extracted **byte-identical** (diffed
  programmatically during review, not by eye: zero characters differ across the
  ~7,900-character fragment shader, and every uniform value matches). `/link`'s
  own shader is human-locked; this refactor does not touch what it renders.
- `src/lib/motion/shaders/moss.ts` (new) — the human-supplied "Perlin Noise" moss
  palette (adapted from an open-source React/Paper-Shaders component,
  Apache-2.0), ported to this project's vanilla WebGL engine rather than pulling
  in React/Tailwind/shadcn — this codebase ships zero client React on public
  routes, and the source component's own pointer-follow cursor branch was never
  reachable in its own shipped config (`cursorEnabled: false`), so it wasn't
  ported either. Shader source and uniform values are otherwise the human's
  supplied values verbatim.
- `src/lib/motion/musicBackdrop.ts` (new) — mounts `shaderField.ts` + the moss
  shader on Music's canvas, scoped to that section (not fixed full-viewport like
  `/link`). Adds an `IntersectionObserver` to pause the render loop while the
  section is scrolled off-screen — the one thing `/link`'s always-visible fixed
  backdrop never needed. Mirrors `heroSequence.ts`'s established idempotent-init
  / pagehide-teardown / bfcache-pageshow-reinit pattern.
- `src/components/PlasmaBackdrop.astro` (modified) — only the inline `<script>`
  changed, from the ~280-line engine to a 4-line call into the shared module.
  Markup and `<style>` are byte-identical to before (confirmed via `git diff`).
- `src/components/Music.astro` (modified) — the mobile-only static hero-image
  background is replaced by the section-scoped shader canvas at every
  breakpoint. Because the moss palette is light/cream-dominant (unlike Plasma's
  dark palette), the section's whole colour scheme flipped from
  light-desktop/dark-mobile to dark-ink-on-light-field throughout: `--focus-ring`
  now applies unconditionally instead of desktop-only, every glass card
  (`.music__stack`, `.release__frame`, `.release__placeholder`) flipped from a
  white-tinted to a dark-tinted translucent fill, and every text element sitting
  directly on the bare backdrop (not inside a glass card) was re-tuned for the
  new background — see Contrast below.
- `e2e/task-4.3-music-backdrop.spec.ts` (new) — 5 tests: render/`data-ready`,
  `IntersectionObserver`-driven pause/resume, hidden-tab pause, reduced motion,
  and the no-JS CSS-gradient floor. Stubs `IntersectionObserver` rather than
  fighting `/`'s real Lenis+GSAP scroll physics to scroll Music into view live —
  first attempt tried real scrolling and repeatedly fought Lenis's easing and
  Hero's pin-consumed scroll distance; the stub tests the actual contract
  `musicBackdrop.ts` has with the browser instead, and is scoped to only wire up
  the test hook for a target carrying `data-music-shader` (review-caught: `/`
  also runs Hero's own `IntersectionObserver`, unrelated to this diff).

## Contrast — measured, not assumed

Same discipline Task 3.6 applied to `/link`: every bare-backdrop text element
was checked against the shader's own documented worst-case pixel, composited
through the veil, using the WCAG relative-luminance formula (verified with a
standalone script, not by eye).

| Pair | Ratio | Needs |
|---|---|---|
| `.music__heading` / `.music__empty` (full opacity) | 6.47:1 | 4.5 |
| `.music__platforms a` resting (0.85 opacity) | 5.41:1 | 4.5 |
| `.music__platform--pending` (0.6 opacity, disabled affordance) | 3.34:1 | 3.0 |
| `.release__title` / `.release__meta` (0.85 opacity) | 5.41:1 | 4.5 |
| `--focus-ring` (`--color-ink` on the veiled backdrop) | >10:1 | 3.0 |

Worst case used: the shader's darkest documented colour stop (`rgb(16,20,8)`,
its near-black palette entry, from `shaders/moss.ts`) under the lightest point
of the veil ramp (55%, top of section — mobile's `column-reverse` layout puts
the release grid there, not just the player stack).

## Acceptance

| Criterion | Result |
|---|---|
| `npm run check` | 0 errors / 0 warnings / 0 hints, 3/3 unit tests |
| `npm run build` | clean |
| Public React | none (`grep -io react` on `/`'s built HTML: no matches) |
| `/link` regression | **5/5** passing (`link-plasma-backdrop.spec.ts`, unmodified test logic) against the refactored shared engine |
| Music backdrop suite | **5/5** passing (`task-4.3-music-backdrop.spec.ts`) |
| Full combined run | **10/10** passing together, 1.6 min |
| Music's marginal cost on `/` | ~4.3 KiB gzip (`Music.astro`'s own script 3.2 KiB + the shared `shaderField.ts` chunk 1.16 KiB, deduplicated with `/link`) |
| `/` total first-party JS | comfortably under the plan's 150 KiB gzip budget even generously counting the concurrent, in-progress Hero work |
| No-JS | Music's content, links, and headings render; canvas never gets `data-ready`; the section's own CSS gradient floor (light cream/lime/near-black, matching the shader) stands in |
| Reduced motion | artwork renders once, 0 continuous draws — frozen, not blank |
| Hidden tab | draw count stops advancing |
| Off-screen (this mount's own addition over `/link`'s fixed backdrop) | draw count pauses when the section scrolls out of view, resumes when it scrolls back |

## Independent review (`agent-skills:code-reviewer`)

Two real issues found and fixed:

1. **Test-isolation gap**: the `IntersectionObserver` stub globally overwrote a
   test hook for *any* observed target, and `/`'s Hero also constructs its own
   observer — today's pass depended on script-execution ordering that happens to
   favour Music's call, which is exactly the ordering the concurrent Hero session
   was actively editing. Fixed by scoping the stub to targets carrying
   `data-music-shader`.
2. **GL resource leak on bfcache reinit**: `dispose()` stopped the rAF loop and
   removed listeners, but never freed the compiled program/buffer.
   `canvas.getContext("webgl")` returns the *same* context on a second call, so
   each bfcache round-trip through `/` would have compiled a fresh program on top
   of the previous cycle's orphaned one. Fixed: shaders are deleted immediately
   after linking (standard practice, not just an oversight fix), and `dispose()`
   now deletes the program and vertex buffer it created. `/link`'s fixed mount
   never calls `dispose()`, so this path was never exercised there before Music
   needed it.

A third flagged point (the shared engine's cursor uniform defaults to
`(0,0,0,0)` rather than `/link`'s pre-refactor `(0, 4.0, 0.65, 0.3)`) was
confirmed harmless and intentional: presence `0` gates every branch that reads
the other three components in both shaders, verified by reading every
`u_cursorPresence`-guarded branch in `shaders/plasma.ts` and `shaders/moss.ts`.

## Known, deliberate, still open

- The Hero→Music transition/seam is **not built** — explicitly out of scope for
  this pass, deferred until Hero's own concurrent rework lands. Hero currently
  fades to `--color-paper` (light) at its own bottom edge; Music now also opens
  light (cream), which happens to read as a smoother match than the dark copper
  Plasma would have — a happy accident, not a fix, and still not a designed
  transition.
- Task 4.3's actual scope (scroll-triggered reveal timelines, hover motion) has
  not been started. This amendment only shipped the backdrop.
- One test run during this session (`marking the section out of view...`) hit a
  `page.evaluate` call that hung for the full 45s test timeout — a synchronous
  browser call, which can only hang if the page's own JS thread is stalled, not
  from anything the test or the shipped code does. Traced to the shared
  environment: 21 concurrent `chrome.exe` processes were running at the time,
  from this session's own long test history plus the concurrent Hero session's
  tooling. The same test subsequently passed cleanly (24.5s) in a clean
  10/10 combined run once the immediate load eased. Recorded here rather than
  silently retried away.
