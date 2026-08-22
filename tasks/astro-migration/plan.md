# Sölbo Cinematic Website Migration Plan

**Date:** 2026-07-22
**From:** Next.js 16 · React 19 · Tailwind 4 · Supabase · Vercel
**Target:** Astro 7 · vanilla CSS · Keystatic · Cloudflare Pages
**Delivery style:** parity-first, measured, reversible

## Outcome

Rebuild the existing one-page Sölbo showcase on Astro while preserving its structure, visual identity, responsive behavior, motion language, content, and player integrations. Add a dedicated, fast `/link` social landing route while keeping `/` as the cinematic homepage. Reduce public runtime and critical-path cost, remove unused dependencies, make content Git-backed and client-editable, and move hosting to Cloudflare only after the risky integration points are proven.

## Approved `/link` scope amendment

Checkpoint 0 approval on 2026-07-27 added the following research inputs to the migration:

- `tasks/prompts/solbo-2026-feature-experience-strategy.md`
- `tasks/prompts/solbo-underground-electronic-web-research-2026-07-23.md`

The approved migration addition is a dedicated `/link` route for social-profile traffic with direct Listen, Buy, Shows, Book, social, and `View site` actions. It must work as static HTML without JavaScript, use the Sölbo visual language without copying a reference site, and treat transitions or atmosphere as optional enhancement. `/link` must not preload the cinematic Hero sequence or ship public React. Build and preview it after the Astro foundation rather than creating a throwaway Next.js version.

The broader feature portfolio in the research documents informs content and architecture decisions but is not automatically authorized for this parity-first migration. Add those features only through later task or checkpoint approval.

## Non-goals

- No redesign, new information architecture, or copy rewrite during the migration.
- No removal of cinematic motion merely to improve a synthetic score.
- No public React runtime unless a measured exception is approved.
- No early deletion of the Vercel deployment, Supabase project, SQL history, or rollback assets.
- No new blog/Markdoc system unless a content requirement is approved.
- No claim of zero JavaScript or guaranteed perfect Lighthouse scores.

## Definition of done

- The public page matches the approved reference at 375×812, 768×1024, and 1440×900, including transition seams and pinned-scroll behavior.
- Keyboard navigation, focus visibility, semantic headings/landmarks, and reduced-motion behavior pass review.
- The home route is prerendered and ships no React runtime unless an approved exception is recorded.
- The `/link` route is independently testable in preview, works without JavaScript, stays within its page budget, and never preloads the home Hero sequence.
- Shows, releases, social links, booking details, and site copy are editable through the approved Keystatic workflow.
- A content edit can be authenticated, previewed, committed, deployed, verified, and rolled back by following the client guide.
- Cloudflare preview and production pass the functional, browser, security-header, and performance gates.
- DNS cutover has a documented rollback and the old production path remains recoverable through the observation window.

## Performance budgets

Budgets are initial targets and must be confirmed after Phase 0 measurement:

| Metric | Target |
|---|---|
| Public first-party JS | ≤150 KiB gzip, excluding third-party player frames |
| Public React runtime | 0 bytes unless checkpoint exception is approved |
| Initial critical-path transfer | ≤1.5 MiB on the home route |
| Initial hero media | ≤750 KiB before the user enters/scrolls |
| Full mobile hero sequence | ≤8 MiB and never blocks first interaction |
| `/link` initial transfer | ≤200 KiB before interaction; no Hero sequence preload |
| Lighthouse mobile median | Performance ≥90; Accessibility/Best Practices/SEO ≥95 |
| Lab CWV proxies | LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 |
| Build | Clean type/check/build with no console errors in preview |

Run Lighthouse three times under the same profile and use the median. Field CWV requires post-launch observation and cannot be certified by Lighthouse alone.

## Delivery topology

Use a separate migration branch and worktree so the current `main` deployment stays intact. Run the current Next site and Astro preview side by side for regression work. Replace the project root on the migration branch only; do not maintain a nested second application long term.

```text
main / current worktree                  migration/astro-7-cloudflare worktree
Next + Supabase + Vercel                Astro + repo content + preview hosting
          |                                          |
          `------------- parity comparison ----------'
                                                     |
                                                     v
                                      checkpoint approval and DNS cutover
```

## Phase 0 — Baseline and parity contract

### Task 0.1: Freeze the recoverable baseline

Record the current commit, dependency versions, build output, production/preview URLs, environment-variable names, API response shapes, rollback owner, and the human-approved no-data-migration waiver. Legacy Supabase shows/releases data is not migration input.

**Acceptance:**

- [ ] Baseline commit and production URL are recorded.
- [ ] `npm run build` passes and output is attached to the task record.
- [ ] Human-approved no-data-migration waiver is recorded; no live Supabase export is required.
- [ ] Vercel and Supabase remain untouched and recoverable.

### Task 0.2: Create the visual and interaction contract

Recover useful historical design context from Git, but treat the current rendered site as canonical. Capture stills and short recordings at the three reference viewports plus reduced motion. Inventory every section, seam, pin, hover, player, link, and loading state.

**Acceptance:**

- [ ] Reference stills/recordings exist for mobile, tablet, and desktop.
- [ ] DOM/content order and responsive differences are documented.
- [ ] Hero entry lock, canvas scrub, Music pin, Shows motion, Footer waves, and shader behavior are captured.
- [ ] Human approves the parity contract.

### Task 0.3: Establish measured budgets

Capture a production network trace, compressed JS/CSS/font/media transfer, request count, three Lighthouse runs, and observable console/runtime errors. Separate first-party cost from Spotify/SoundCloud frames.

**Acceptance:**

- [ ] Baseline measurements use a reproducible command/profile.
- [ ] The performance budgets above are confirmed or amended with a written reason.
- [ ] The hero's current readiness and loading waterfall are documented.

### Checkpoint 0: Baseline and parity contract approved

Do not begin the bulk port without this approval.

## Phase 1 — Prove the risky architecture

### Task 1.1: Build a disposable Astro/Cloudflare compatibility spike

Pin the current compatible Astro 7, Cloudflare adapter, React integration, Keystatic packages, Wrangler, and Node version in an isolated spike. Verify static public output plus a dynamic server route on a Cloudflare preview deployment.

**Acceptance:**

- [x] Exact compatible versions and Node engine are recorded.
- [x] Static `/` and a dynamic test endpoint work in preview.
- [x] `nodejs_compat`, compatibility date, and prerender environment are explicit.
- [x] Spike contains no production secrets or cutover changes.

### Task 1.2: Prove Keystatic GitHub mode end to end

On the preview deployment, authenticate through `/keystatic`, read seeded collections, create/edit/delete a test record, commit it to a test branch, build a preview, and roll it back. Measure edit-to-preview latency and document access requirements.

**Acceptance:**

- [ ] GitHub OAuth callback and all required secrets work in preview.
- [ ] A user with intended permissions can complete CRUD without terminal access.
- [ ] The content commit triggers the expected preview deployment.
- [ ] Failed builds and rollback behavior are demonstrated.
- [ ] Cloudflare is approved, or the plan records the Vercel Astro adapter fallback.

### Task 1.3: Benchmark hero delivery options

Compare at least a progressively loaded optimized image sequence and a scrub-capable encoded video. Preserve scroll timing and image quality while testing low-memory mobile behavior, decode cost, cache behavior, and reduced motion. Do not gate entry on all frames.

**Acceptance:**

- [ ] Options are compared with bytes, requests, decode behavior, and visual notes.
- [ ] The selected approach meets the initial-media and full-sequence budgets or has an approved exception.
- [ ] First interaction works before the complete sequence downloads.
- [ ] Failure falls back to a poster/final frame without trapping scroll.

### Task 1.4: Record the architecture decision

Write the final adapter/host, content storage mode, asset storage choice, hero format, `/link` route policy, and React-island policy. Prefer one host and the smallest dependency set that satisfies the proof.

**Acceptance:**

- [ ] All Gate A/B findings are linked.
- [ ] Cloudflare or Vercel fallback is explicitly selected.
- [ ] `/link` is approved as the dedicated social hub and `/` as the direct cinematic homepage.
- [ ] Markdoc is included only if an approved rich-text need exists.
- [ ] Human approves the target before the root conversion starts.

### Checkpoint 1: Architecture and hero delivery approved

## Phase 2 — Astro, CSS, and content foundation

### Task 2.1: Create the migration worktree and Astro foundation

Create `migration/astro-7-cloudflare` in a separate worktree. Convert the project root on that branch to Astro, pin the approved versions, add check/build scripts, and replace stale Next-only agent instructions with migration-aware repository rules.

**Acceptance:**

- [ ] `main` remains clean and deployable.
- [ ] Astro dev, check, and build pass in the migration worktree.
- [ ] Node version and lockfile are deterministic.
- [ ] Agent instructions no longer point to a deleted design spec.

### Task 2.2: Build vanilla CSS tokens and foundations

Extract only tokens actually used by the rendered site: color, typography, spacing, breakpoints, z-index, easing, and safe-area behavior. Add local font faces using approved formats/weights and create base/reset/layout CSS. Tailwind stays available only until the last ported component is gone.

**Acceptance:**

- [ ] Tokens map to the approved visual contract.
- [ ] CSS works without Tailwind processing in the Astro build.
- [ ] Font licensing permits the selected conversion/subsetting.
- [ ] Focus, reduced-motion, safe-area, and overflow foundations are present.

### Task 2.3: Define curated CMS content collections

Create structured `shows`, `releases`, and `links` collections plus a `site` singleton for newly curated copy, booking, and media references. Define the fields, URL/date validation, priority, labels, and stable ordering needed for the approved CMS; keep cinematic sequence assets outside the CMS.

**Acceptance:**

- [ ] Newly curated CMS fields are documented; no legacy TypeScript/Supabase field mapping is required.
- [ ] Invalid dates, URLs, release types, and required values fail validation.
- [ ] `/link` actions render from validated build-time content with deterministic priority.
- [ ] Collections render at build time without a browser data fetch.
- [ ] No Markdoc dependency exists unless Task 1.4 approved it.

### Task 2.4: Create the base layout and metadata

Port document structure, local fonts, title/description, canonical URL, social metadata, favicon, and shared page composition. Add explicit width/height or aspect ratio where applicable.

**Acceptance:**

- [ ] Static HTML is semantic and contains the expected content before scripts run.
- [ ] Metadata and social previews use production-ready values.
- [ ] No React runtime appears on the public route.

### Checkpoint 2: Foundation review

## Phase 3 — Static structure and vanilla CSS parity

Port markup and responsive styling before reintroducing complex motion. Each task must include side-by-side captures.

### Task 3.1: Port Music

Port the player card, release list, social links, background layers, and mobile/desktop layout. Keep embeds lazy and preserve placeholder/fallback states.

### Task 3.2: Port Shows

Port the editorial image treatment, table/list variants, ticket/sold-out/free states, and responsive columns using build-time content.

### Task 3.3: Port Footer and wave markup

Port booking/contact/social structure and the static SVG/canvas containers needed by the later wave animation.

### Task 3.4: Port Hero static states

Port headline, links, enter affordance, poster/canvas shell, loading fallback, and responsive overlays without enabling the full scroll sequence yet. Replace the `lucide-react` icons and the `motion/react` wave loader with inline SVG and CSS animation.

### Task 3.5: Integrate the static page

Compose Hero → Music → Shows → Footer in the existing order. Match spacing, colors, typography, overlap, and seam states across the reference viewports.

### Task 3.6: Build the dedicated `/link` preview

Build a purpose-made, mobile-first `/link` route using the approved strategy inputs and the existing Sölbo visual language. Include direct Listen, Buy, Shows, Book, social, and `View site` actions from build-time content. Normal navigation to `/` is the baseline; any shared-wordmark or view transition is progressive enhancement. Do not user-agent sniff, preload Hero frames, add a public React island, or create a duplicate `/solbo` route without a separately approved redirect need.

**Acceptance:**

- [ ] `/link` is usable at 375×812, 768×1024, and 1440×900 with visible keyboard focus, reduced-motion behavior, and a no-JavaScript path.
- [ ] All configured actions resolve correctly, and `View site` reaches `/` through normal navigation.
- [ ] Initial transfer is ≤200 KiB, no Hero sequence request occurs, and no React runtime ships.
- [ ] A preview URL plus viewport captures are delivered for human testing.

**Phase acceptance:**

- [ ] All content and controls work with JavaScript disabled, except animation/player behavior that inherently requires it.
- [ ] Screenshot differences are reviewed and intentional exceptions recorded.
- [ ] No section ships React.
- [ ] `/link` passes its action, no-JavaScript, no-Hero-preload, and page-budget checks.
- [ ] Astro check/build remains green.

### Checkpoint 3: Static visual parity approved

## Phase 4 — Motion, canvas, and cinematic parity

### Task 4.1: Add shared motion lifecycle

Initialize Lenis, GSAP, ScrollTrigger, media-query branches, and refresh/cleanup through small route-scoped TypeScript modules. Use data attributes and DOM scoping instead of recreating React refs.

**Acceptance:**

- [ ] Initialization runs once per page visit and does not duplicate listeners/tickers.
- [ ] Resize, navigation, and teardown paths are clean.
- [ ] Native scrolling remains usable if scripts fail.

### Task 4.2: Implement the approved hero sequence

Implement progressive loading, poster-first rendering, frame scheduling, DPR cap, resize drawing, enter behavior, and scroll scrub using the Task 1.3 format.

**Acceptance:**

- [ ] Hero never waits for all frames before allowing entry.
- [ ] Mobile wheel/touch/key handling cannot trap a user after an error.
- [ ] Missing/failed frames degrade to the nearest valid frame or poster.
- [ ] Memory and transfer budgets pass on a real mobile check.

### Task 4.3: Port section timelines

Port Hero, Music, Shows, and Footer timelines one section at a time. Match start/end positions, pinning, scrub/easing, mobile/desktop branches, and transition seam colors.

**Acceptance:**

- [ ] Each section is approved against the reference recording before the next one begins.
- [ ] Refresh and resize do not stack ScrollTriggers.
- [ ] Deep links and keyboard scrolling remain usable.

### Task 4.4: Port waves and shader background

Port the simplex wave field to vanilla TypeScript. Implement the approved direct canvas/WebGL/CSS shader strategy. A React island is permitted only with a measured budget and checkpoint approval.

**Acceptance:**

- [ ] Visual behavior matches at mobile and desktop sizes.
- [ ] Offscreen or reduced-motion behavior avoids unnecessary animation work.
- [ ] Public route contains no React runtime, or the approved exception is documented with bytes.

### Task 4.5: Complete motion accessibility

Define reduced-motion alternatives for every pin, entrance, grain, sequence, wave, and shader. Validate focus, scroll restoration, keyboard input, contrast, and readable content without animation.

### Checkpoint 4: Motion and accessibility parity approved

## Phase 5 — Content and editorial cutover

### Task 5.1: Implement the production Keystatic schema

Configure the approved GitHub/cloud mode, collections, singleton, field labels/help text, image locations, branch behavior, and authentication variables. Keep secrets out of source.

### Task 5.2: Author and validate initial CMS content

Author the initial curated shows, releases, links, copy, and artwork in the approved CMS. Validate record counts, sorting, flags, embeds, artwork, and booking/social destinations.

### Task 5.3: Prove the production editorial loop

From a non-developer account, add/edit a show, update a release, change artwork, preview, publish, observe build status, and roll back. Confirm expected content freshness and deployment delay.

### Task 5.4: Write the Keystatic client guide

Explain login, edits, images, previews, publishing, build failures, rollbacks, account ownership, and support boundaries in plain language.

### Checkpoint 5: Client editorial UAT approved

## Phase 6 — Remove old runtime and optimize

### Task 6.1: Remove superseded code and dependencies

After parity/UAT, remove Next routes/config, Tailwind/PostCSS, Supabase runtime code, mock fetch hooks (`lib/useFetchWithFallback.ts`), unused React UI helpers, `motion`, `lucide-react`, and confirmed dead Three/R3F dependencies. Preserve SQL migrations and an archival export until infrastructure retirement is approved.

### Task 6.2: Optimize media and fonts

Apply the approved hero encoding, responsive release/profile images, cacheable hashed assets, poster/preload priorities, and licensed font conversion/subsetting. Avoid preloading non-critical weights or all sequence frames.

### Task 6.3: Harden third-party and edge behavior

Add CSP/frame sources for Spotify/SoundCloud, referrer policy, security headers, cache rules, robots/sitemap/canonical behavior, error pages, and a friendly CMS no-index policy.

### Task 6.4: Run the release matrix and budgets

Run type/check/build, link/content validation, Playwright Chromium/WebKit checks, mobile real-device smoke, reduced motion, no-JS content, CMS auth/CRUD, three-run Lighthouse, and console/network review.

### Checkpoint 6: Release candidate approved

## Phase 7 — Cloudflare deployment, cutover, and handoff

### Task 7.1: Configure production Cloudflare

Create/verify the client-owned project, production branch, build command/output, Node version, environment variables, compatibility flags, preview policy, logs, and custom-domain readiness.

### Task 7.2: Cut over with rollback

Freeze content briefly, perform a final export/sync, deploy, lower/confirm DNS TTL, switch the domain, verify SSL and all acceptance paths, and keep the documented DNS/Vercel rollback immediately available.

### Task 7.3: Observe and retire deliberately

Monitor errors, CWV, content edits, and build failures for 7–14 days. Retire Vercel runtime and Supabase only after written approval and after ownership, backups, and rollback artifacts are confirmed.

**Final acceptance:**

- [ ] Production domain and SSL are healthy.
- [ ] Public page, players, links, analytics if any, and CMS editorial loop pass.
- [ ] Performance budgets pass or approved exceptions are recorded.
- [ ] Client owns Cloudflare, GitHub/Keystatic, domain, and required secrets.
- [ ] Rollback and support documentation are delivered.
- [ ] Old infrastructure retirement is explicit, not automatic.

### Checkpoint 7: Migration complete

## Effort expectation

Re-estimate after Checkpoint 1. Before the spikes, a realistic range is 12–20 focused engineering days plus review/cutover waiting time. The hero delivery choice, shader parity, and Keystatic/Cloudflare compatibility are the largest variance sources.
