# Task 4.4 — Footer simplex wave field

**Implemented and human-approved 2026-08-17.**

## Scope

The legacy Footer used a React SVG mesh: 10px vertical lines were displaced
by a simplex field and carried a local inertial warp after pointer movement.
It rebuilt hundreds of SVG paths and tens of thousands of path points on
every animation frame.

`src/lib/motion/footerWaves.ts` ports that field to one native 2D canvas
mounted into the existing decorative `.footer__waves` host. It contains the
small simplex evaluator it needs rather than restoring the removed
`simplex-noise` package or introducing a React island. The canvas keeps the
same vertical mesh, low-contrast `rgb(200 203 200 / 11%)` stroke, simplex
displacement, and pointer-inertia response, while drawing the paths directly
to the canvas.

The pointer listener is scoped to Footer and never prevents default, so links
and touch/scroll input retain their native behavior. A `ResizeObserver`
rebuilds the mesh for the current Footer size; an `IntersectionObserver`,
`visibilitychange`, and reduced-motion media query stop unnecessary animation
work. Reduced motion paints one static field. `pagehide` removes all
observers/listeners/canvas state and `pageshow` rebuilds it after bfcache
restores.

The canvas is decorative and added only after JavaScript starts. Without
JavaScript, the host remains empty and Footer content remains ordinary static
HTML.

## Verification

| Check | Result |
| --- | --- |
| `npm run check` | 0 errors, 0 warnings, 0 hints; 3/3 unit tests pass |
| `npm run build` | Cloudflare server build passes |
| Footer wave browser suite | `e2e/task-4.4-footer-waves.spec.ts`: 5/5 pass |
| Shared ambient regression | Music backdrop + Footer waves: 10/10 pass |
| Shared timeline regression | Music, Shows, and Footer timelines: 14/14 pass |
| Desktop + mobile | Canvas paints the full Footer mesh at 1440×900 and 375×812 |
| Pointer behavior | Direct pointer sweep creates the local mesh distortion without intercepting input |
| Reduced motion | One static canvas paint; no animation loop |
| Offscreen + hidden tab | Animation pauses and resumes correctly |
| No JavaScript | No canvas is mounted; booking/link content remains present |
| Public React | None added; native canvas only |

Responsive capture evidence:

- `references/task-4.4-footer-waves/desktop-1440x900.png`
- `references/task-4.4-footer-waves/tablet-768x1024.png`
- `references/task-4.4-footer-waves/mobile-375x812.png`
- `references/task-4.4-footer-waves/desktop-1440x900-reduced-motion.png`
- `references/task-4.4-footer-waves/desktop-1440x900-pointer.png`

## Approval gate

Task 4.4 was human-approved before Task 4.5's full accessibility and
failure-mode audit begins.
