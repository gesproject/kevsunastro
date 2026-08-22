# Task 4.2f — Remove inactive Hero cursor shader path

**Date:** 2026-08-09
**Branch:** `migration/astro-7-cloudflare`

## Scope

The Hero backdrop deliberately ships without cursor interaction: its only cursor uniform was fixed to a zero `presence`, and no page listener ever updated it. The fragment shader still carried every cursor distortion mode, pointer coordinate packing, and two per-pixel cursor-condition branches despite that path being unreachable.

This Ponytail/YAGNI amendment removes that dead shader path rather than retaining a disabled implementation:

- removes `u_cursor`, pointer-coordinate packing, cursor macros, and the unreachable fragment branches;
- changes the remaining offset transport from a packed `vec4 u_space` to `vec2 u_offset`;
- retains every active palette, field, quantization, drift, grain, and finish value exactly, including Task 4.2e's 16-level quantization;
- records the ceiling next to the uniform setup: cursor distortion requires an explicitly approved, budgeted feature rather than a dormant code path.

`HeroBackdrop.astro` drops from 19,716 to 16,840 UTF-8 source bytes: **2,876 bytes removed**. The executable cursor-path removal accounts for 2,118 of those bytes; the remainder replaces stale keyed/mobile implementation commentary with the current opaque-mask design. This also removes uniform-dependent conditionals from every rendered fragment. There is no public cursor feature, listener, or API to preserve.

## Verification

- `npm run check`: 0 errors, 0 warnings, 0 hints; 3/3 unit tests passed.
- `npm run build`: Cloudflare server build passed.
- The permanent `playwright.config.ts` command successfully rebuilt and started the Worker; its actual desktop opaque-footage assertion passed end-to-end.
- The emitted Hero backdrop bundle contains no `u_cursor`, `u_mouse`, or `cursorMask` symbols.
- A direct Playwright Chromium probe extracted the exact `VERT` and `FRAG` strings from `HeroBackdrop.astro`, then compiled and linked them in a WebGL1 context: vertex compiled, fragment compiled, and program linked; all logs were empty.
- The full built-Worker behavioral suite is now stable and passes 7/7 after Task 4.2g removes unrelated Hero-frame traffic from its shader-only check. See `task-4.2g-hero-worker-verification-stability.md` for the exact configuration and result.

## Open

Human visual approval of the Hero amendment remains required before Task 4.3's next section-timeline pass begins. Re-run the built-Worker Hero Playwright suite when the local Wrangler proxy is stable.
