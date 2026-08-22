# Task 1.4 — Architecture decision (approved at Checkpoint 1)

**Status:** approved by the human at Checkpoint 1 on 2026-08-05. Task 2.1 may begin; Hero production integration remains deferred to Task 4.2.

## Evidence carried forward

| Gate | Result | Decision impact |
| --- | --- | --- |
| [Task 1.1 — Astro / Cloudflare compatibility spike](task-1.1-compatibility-spike.md) | Astro 7 and `@astrojs/cloudflare` served a prerendered route and an on-demand Node-compatible endpoint locally and from an isolated Cloudflare preview. | Cloudflare Workers with static Assets remain the primary host. |
| [Task 1.2 — Keystatic GitHub proof](task-1.2-keystatic-github-proof.md) | The dedicated proof Worker authenticated through the GitHub App, performed create/update/delete, demonstrated a non-production branch preview, a deliberate failed build, and a successful revert/preview recovery. | Keystatic GitHub mode is viable for client editing, with Git history and Cloudflare preview rollback. |
| [Task 1.3 — Hero delivery benchmark](task-1.3-hero-delivery-benchmark.md) | H.264, CRF 23, GOP 10 met the byte budget and materially reduced browser working set; AVIF sequence is the measured fallback. | The iPhone result below found H.264 seeking janky, so Task 4.2 must use the documented AVIF-sequence fallback rather than scrub video. |
| [Task 0.2 — Visual and interaction contract](visual-interaction-contract.md) | The approved desktop Hero reserves a fading cinematic canvas on the right; the ≤767px state is a link-tree entry, and 768px begins the desktop path. | The supplied assets must be assigned by visual role before implementation. |

## Supplied hero-source inventory

The files below are source assets. They were inspected without renaming, transcoding, editing, moving, or committing them. Re-check their fingerprints before Task 4.2 creates any derived delivery media.

| Source file | SHA-256 | Container / video | Duration | Visual role observed |
| --- | --- | --- | --- | --- |
| `public/videos/Solbo-Hero-V2.mp4` | `FFFA8489C1FED121F615A2AD8FB174A797F4F04FAB8CD638DF5A259EE5A560E9` | MP4, H.264 High, yuv420p, 3840×2160, 24 fps, no audio | 9.708 s | Wide 16:9 composition with generous pale negative space and a small figure moving through the right half — **human-approved desktop Hero source**. |
| `public/videos/9.16.3.mp4` | `D9F6CBD7C55877FA0A07B2206E2717144BAC1F6434DA0F8412CF5055A9283367` | MP4, H.264 Main, yuv420p, 1176×1080, 24 fps, AAC audio | 8.042 s | Tighter near-square close-up with the subject filling the frame — **human-approved mobile Hero companion**. Its audio must not play in the Hero. |

The human approved the visual assignment after comparing the two sources in the isolated device test: the wide master serves desktop Hero and the close companion serves mobile Hero. The originals remain source assets only; this role decision does not authorize source modification or lock their H.264 encodes as production scrub media.

## Target architecture

| Concern | Decision | Boundary / fallback |
| --- | --- | --- |
| Framework and deploy target | Astro 7 with `@astrojs/cloudflare`, deployed as one Cloudflare Worker with static Assets. | Retain the current Next.js/Vercel/Supabase site as the rollback path until post-cutover acceptance. Use the Vercel Astro adapter only if the proved Cloudflare runtime becomes incompatible during actual product integration. |
| Editorial storage | Keystatic GitHub mode against the migration repository, using the installed GitHub App and Git commits as the audit/rollback record. | The completed proof used a separate repository and Worker; it does not modify or substitute for the production repository. Confirm final repository access before Task 5. |
| Asset storage | Versioned static media served through Cloudflare Assets, with immutable derived hero media emitted only in Task 4.2. Keep both originals above as source assets and keep cinematic media outside Keystatic collections. | No R2, Images, or database is needed for this parity-first scope. Do not modify either original; derived encodes, posters, and responsive variants are separate files. |
| Hero delivery | **AVIF sequence selected for Task 4.2.** The iPhone result found the wide H.264 master janky while seeking, so scrub video is not locked despite its benchmark result. Use Task 1.3's documented AVIF CRF 32 sequence alternative, with a final-frame poster, for the approved desktop/mobile source roles. | Keep both MP4s unchanged as sources. Poster-first rendering, missing/failed-frame fallback to the nearest valid frame or poster, and reduced-motion fallback must leave native scrolling available; Hero must not wait for all frames before entry. |
| Routes | `/` stays the direct cinematic homepage. `/link` is the small, JavaScript-independent social hub and its understated `View site` CTA uses normal navigation to `/`. It never requests Hero media. | Do not create a duplicate public route or pre-entry device-specific redirect. |
| Client runtime | Vanilla, route-scoped TypeScript for motion and media; public React runtime remains 0 bytes. | A React island needs a written budget and a later explicit checkpoint exception. |
| Rich text | No authored Markdoc or rich-text content. | Keystatic's transitive `@markdoc/markdoc` package is permitted by human clarification on 2026-08-05; do not create Markdoc content or introduce a direct Markdoc feature without a separately approved editorial rich-text need. |

## Device validation and remaining approval

On an iPhone 17 Pro Max in Safari, the human tested the wide master through the isolated device test. The exact iOS version was not supplied. The scrub slider was **janky** rather than smooth. No black flash, pause, fullscreen exit, or sound was observed, and the page remained scrollable after the test. This passes the inline, mute, and scroll-safety smoke checks but fails the smooth-seeking gate, so AVIF is selected above. No Android result was supplied.

The human explicitly approved the visual source mapping: wide master for desktop Hero and close companion for mobile Hero. The human then approved the full architecture target and Checkpoint 1 on 2026-08-05: Astro 7 + Cloudflare, Keystatic GitHub mode, AVIF Hero delivery, `/link` as the social hub, no public React, and no Markdoc. Task 2.1 may begin; Hero integration remains deferred to Task 4.2.

### Local AVIF delivery preview

An isolated local delivery preview is available at [`references/task-1.4-hero-delivery-preview/`](references/task-1.4-hero-delivery-preview/). It derives 233 desktop AVIF frames from the approved wide master at 1920×1080 and 193 mobile AVIF frames from the approved close companion at 960px wide. Its canvas path loads the final poster first, requests frames progressively, keeps at most 32 JavaScript-held images, switches source at 768px, and has reduced-motion and simulated-failure paths that leave scrolling available.

`node --check`, local HTTP asset checks, and a no-route Cloudflare Worker dry-run passed. The human explicitly chose to keep the preview local, so no Worker version, public preview URL, route, DNS, Vercel, Supabase, or production asset was created. See its [`README.md`](references/task-1.4-hero-delivery-preview/README.md) for local run and verification details. This is an implementation test only; it neither completes Task 4.2 nor grants Checkpoint 1 approval.

### Isolated iOS test

Use [the isolated device test](https://solbo-hero-media-device-test.nickgagne92.workers.dev/) on the physical iPhone. It is a separate no-route Worker (`solbo-hero-media-device-test`, version `f181e0c9-2c25-4356-a785-2c5b78a862d6`), not the site, the CMS proof Worker, or production. It serves the two source MP4s unchanged, uses a muted `playsinline` element, provides an explicit scrub control, and deliberately never installs a scroll lock.

The public page and both MP4 responses were smoke-checked after deploy. A command-line `Range` probe received the complete source asset as HTTP 200 rather than a 206 response. That does not prevent the physical Safari behavior test, but it is not evidence of progressive byte-range delivery; re-verify the final encoded asset's actual request behavior in Task 6.2 before launch.

## Scope protection

This record changes no application code, deployment, DNS, Vercel, Supabase, video source asset, or production repository configuration. Existing unrelated worktree changes remain outside this task.
