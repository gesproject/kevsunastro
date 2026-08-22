# Task 5.3 — Production editorial UAT

**Status: awaiting client-owned authentication and a non-developer tester.**

## Preflight repair — 2026-08-22

The production-hardening cleanup removed the existing Keystatic Astro integration
from `astro.config.mjs`. That left `/keystatic/` and
`/api/keystatic/[...params]` unregistered, so the CMS admin returned 404.
The original Cloudflare compatibility integration has been restored alongside
the sitemap integration; no credential values were read, added, or deployed.

| Check | Result |
| --- | --- |
| `npm run check` | passes: 0 Astro diagnostics and 4 unit tests |
| `npm run build` | Cloudflare server build passes |
| `e2e/task-5.1-keystatic-config.spec.ts` | passes: Worker serves `/keystatic/`, login route redirects, public routes remain isolated |

## Remaining live exercise

1. A client-owned GitHub App is configured for the target repository and its
   callback URL uses the active Worker/production domain.
2. The public app slug and three server-only Keystatic values are configured in
   the target Cloudflare Worker without exposing their values here.
3. A non-developer with repository write access edits a Show and Release,
   changes artwork, opens the draft preview, publishes, observes build status,
   and rolls back the change.
4. Record the content freshness and deployment delay, then ask for Checkpoint 5
   approval before starting Task 5.4.
