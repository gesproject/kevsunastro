# Task 4.4 amendment — Footer breathing layout

**User-directed 2026-08-22.**

## Scope

The Footer now has sufficient room for its existing canvas field, full
watermark, booking email, and social navigation to read as one closing
composition.

- Mobile uses a minimum `60svh` Footer and a `38svh` content field.
- Desktop uses a minimum `78svh` Footer and a `58svh` content field.
- The booking email and the social/copyright group are right-aligned in one
  vertical contact rail, with space between them.
- The original oversized SÖLBO watermark, including its final O, is unchanged.

No assets, client dependencies, rendering strategy, or motion behavior changed.

## Verification

| Check | Result |
| --- | --- |
| Footer browser suite | `e2e/task-4.4-footer-waves.spec.ts`: 7/7 pass |
| Desktop geometry | 1440×900 confirms a ≥75svh Footer, full wordmark, and aligned contact rail |
| Mobile geometry | 375×812 retains the full closing composition without overflow |
| `npm run check` | Passes |
| `npm run build` | Cloudflare server build passes |
