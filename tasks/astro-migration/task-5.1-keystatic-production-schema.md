# Task 5.1 — Production Keystatic schema

**Implemented 2026-08-22.**

## Scope

`keystatic.config.mjs` manages the existing Astro JSON contract directly in
GitHub mode for `gesproject/kevsunastro`:

- **Shows**, **Releases**, and **Links** remain JSON collections beneath
  `src/content/`.
- **Site settings** remains the `src/content/site/site.json` singleton.
- Images are versioned with the site: show images in `public/images/shows/`,
  release artwork in `public/artwork/`, and the profile image in
  `public/images/`.
- `keystatic/` is the namespace for editorial draft branches. Task 5.3 will
  prove its preview, publish, and rollback workflow with a non-developer.

The configuration supplies plain-language labels and guardrails for every
content field. It rejects blank required text, invalid calendar dates,
out-of-range or missing priorities, non-HTTPS external URLs, malformed booking
addresses, and invalid Link schemes before an editor can save. The existing Astro schema remains the
single build-time guard for cross-field rules: an available Show needs a ticket
URL, and an enabled Link needs a destination. It does not add records, invent
destinations, move Hero frames, or add client code to a public route.

## Cloudflare compatibility and secrets

Keystatic 5.2.0 expects its Astro API route to read Cloudflare environment
values from the retired `Astro.locals.runtime.env` location. The small
`src/keystatic-cloudflare-api.mjs` wrapper supplies the current
`cloudflare:workers` binding at that compatibility boundary; it contains no
credential value.

`.env.example` documents the four values required to activate GitHub sign-in:

- `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` — a public GitHub App identifier.
- `KEYSTATIC_GITHUB_CLIENT_ID`
- `KEYSTATIC_GITHUB_CLIENT_SECRET`
- `KEYSTATIC_SECRET`

The client must keep the last three in its private local environment and the
Cloudflare secret manager. The GitHub App must be authorised to write to
`gesproject/kevsunastro`, and its callback must allow
`https://<editor-host>/api/keystatic/github/oauth/callback`. No value was
read, created, printed, committed, or deployed in this task.

## Verification

| Check | Result |
| --- | --- |
| Keystatic schema unit test | GitHub storage, branch namespace, JSON paths, singleton path, all 7 existing Link records, and invalid scalar-value rejections pass |
| Built Worker smoke test | `/keystatic/` responds with the GitHub login entry point; `/` and `/link/` contain no Keystatic marker |
| Placeholder binding smoke test | Every built Worker receives harmless fixed Wrangler bindings while its build-time Keystatic variables are blank; the OAuth redirect therefore proves the Cloudflare runtime wrapper without using a real credential |
| Public React audit | Homepage (3 scripts) and `/link` (1 script) resolve no React or Keystatic markers |
| `npm run check` | 0 errors, 0 warnings, 0 hints; 4 unit tests pass |
| `npm run build` | Cloudflare server build passes |

## Next boundary

Task 5.2 begins only when verified client content, artwork, and final outbound
destinations are supplied. Task 5.3 owns live editor authentication, preview,
publish, failure, and rollback proof.
