# Task 4.2e — Hero backdrop posterisation reduction

**Date:** 2026-08-09  
**Branch:** `migration/astro-7-cloudflare`

## Scope

The uncommitted Task 4.2d Hero build still showed visible broad bands in `HeroBackdrop.astro`'s open shader field. The user identified it as the next retune candidate.

The retune changes only the existing `u_intensity` value from `0.35` to `0.78`. In the supplied shader's existing formula:

```
steps = 2 + floor(u_intensity * 18)
```

that changes the field from 8 to 16 tonal levels. It halves the discontinuity between adjacent quantized bands while retaining the shader's deliberately stepped character. No assets, JavaScript bytes, event listeners, animation loops, uniforms, or rendering passes were added.

This deliberately supersedes the earlier byte-exact `u_intensity` value: it is a targeted user-directed visual correction, not a new shader strategy.

## Verification

- `npm run check`: 0 errors, 0 warnings, 0 hints; 3/3 unit tests passed.
- `npm run build`: Cloudflare server build passed.
- `e2e/hero-plate-backdrop.spec.ts`: 7/7 assertions passed against fresh built Workers. Its initial single-worker invocation passed the first 4 tests before local `wrangler dev` exited; the remaining 3 were rerun individually and passed. The connection refusals occurred before navigation and match the already-recorded local Worker instability, not an application assertion failure.
- Direct built-Worker Playwright captures at 1440x900 and 375x812 passed. Local ignored artifacts are retained at `test-results/hero-visual-review/`. Inspection confirms an opaque subject, the intended plate dissolve, and a controlled stepped backdrop at both breakpoints. The shader is intentionally not fully smooth; the 16-level retune reduces the original broad quantization jump without changing its art direction.

## Open

Human visual approval of the full Hero amendment remains required before Task 4.3's next section-timeline pass begins.
