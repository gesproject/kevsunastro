# Claude Code Execution Loop: Astro 7 / Keystatic / Cloudflare Migration

## Source of truth

1. `tasks/astro-migration/plan.md` — scope, acceptance criteria, budgets. It wins every conflict.
2. `tasks/astro-migration/todo.md` — the only task list and status record. This file does not duplicate it.
3. `AGENTS.md` — repository rules.
4. This file — how a Claude Code session executes the plan.

Superseded and not to be resumed: the Next.js/Supabase/Vercel production task order that previously lived in `tasks/codex-loop.md` (renamed to this file) and in the deleted `tasks/claude-code-continuation-prompt.md`.

## Resume point — 2026-08-08

- **`/link` Plasma restyle is human-approved and locked (2026-08-08).** Recorded as a Task 3.6 amendment in `todo.md`; full write-up in `tasks/astro-migration/task-3.6-link-plasma-restyle.md`. Task 4.3 remains the active task and was not started.
- **`/link` is no longer a zero-JavaScript route.** It ships exactly one script tag — `PlasmaBackdrop.astro`'s decorative WebGL canvas. Any future check that asserts "0 scripts on /link" is now wrong; assert no motion library / no React / no Hero sequence instead. The no-JavaScript, reduced-motion, and hidden-tab paths are all still guaranteed and covered by `e2e/link-plasma-backdrop.spec.ts`.
- Screenshotting `/link` requires pausing the backdrop first — a continuous rAF loop never yields the stable frame `page.screenshot()` waits for. `checkpoint-3-evidence.spec.ts` has a `pauseBackdrop()` helper for this; reuse it rather than rediscovering the timeout.
- The shader's uniforms are pinned by the human's brief and were shipped byte-exact, including a hue rotation that renders the specced cyan palette as copper. Do not "correct" the palette; that mismatch is a recorded, deliberate decision.
- **Music section shipped an animated shader backdrop, same day (Task 4.3 amendment), human-directed.** `src/lib/motion/shaderField.ts` is now the shared, shader-agnostic WebGL engine both `/link`'s Plasma backdrop and Music's new "moss" backdrop run through (`src/lib/motion/shaders/{plasma,moss}.ts`, `src/lib/motion/musicBackdrop.ts`). `/link`'s shader/markup/CSS are unchanged (verified byte-identical). Full write-up: `tasks/astro-migration/task-4.3-music-backdrop.md`. Task 4.3's own remaining scope (reveal timelines, the Hero→Music seam) was not started — this was the backdrop only, deferred at the human's explicit direction.
- **A second Claude Code session was active on Hero the entire time this ran, in the same working tree, uncommitted.** `Hero.astro`, `HeroBackdrop.astro`, `HeroSocialNav.astro`, `heroSequence.ts` were never touched by the Music work, on purpose. That concurrency made the shared local dev server (`wrangler dev` and plain `astro dev` both, tried repeatedly) genuinely unreliable for a long stretch — a `workerd` native-binary crash (`std::terminate()`), an IPv6-only bind that silently didn't answer on `127.0.0.1`, intermittent SSR failures on `/` timed to the other session's save/reload cycles, and finally a `page.evaluate` call that hung the full test timeout with 21 concurrent `chrome.exe` processes alive. None of these were fixed by retrying blindly; each was diagnosed first (checked what was actually listening, read the actual crash output, counted processes) before deciding whether to retry, change approach, or just document the gap. If you hit unexplained e2e flakiness while another session is active, check for this pattern before assuming a code regression — and prefer starting your own `wrangler dev`/`astro dev` and confirming it answers on `127.0.0.1` over trusting `reuseExistingServer` blindly.
- **Task 4.2e reduces the Hero backdrop's open-field posterisation.** The user-directed `u_intensity` retune changes the existing quantization formula from 8 to 16 tonal levels with no added code or runtime work. Full record: `tasks/astro-migration/task-4.2e-hero-backdrop-banding.md`. This does not approve the Hero visual pass or authorize Task 4.3's remaining timeline work.
- **Task 4.2f removes disabled cursor shader work from the Hero.** Cursor presence was permanently zero and no listener updated it, so the uniform, pointer packing, distortion modes, and per-fragment conditions were dead code. Removing them and correcting the stale keyed/mobile implementation comments cuts 2,876 source bytes without changing the active visual recipe; the exact fragment still compiles and links in Playwright Chromium. Full record: `tasks/astro-migration/task-4.2f-hero-backdrop-dead-cursor-removal.md`. This likewise does not approve the Hero visual pass or authorize Task 4.3's remaining timeline work.
- **The local Playwright Worker command pins IPv4 loopback and inspector port 9230, and Hero's shader-only test aborts irrelevant frame traffic.** The former removes Wrangler's random-inspector startup failure; the latter prevents the test from sending two 117-frame loads when it asserts only WebGL readiness. The normal Hero suite now passes 7/7 in one shared built-Worker process. Full record: `tasks/astro-migration/task-4.2g-hero-worker-verification-stability.md`.

## Resume point — 2026-08-07

- Branch/worktree: `migration/astro-7-cloudflare`. Checkpoints 0, 1, and 2 approved.
- Phase 2: Tasks 2.1, 2.2, 2.3 complete. **Task 2.4 stays open on the domain only; it does not gate Phase 3.**
- **Phase 3 (Tasks 3.1–3.6) is fully complete, including verification.** Playwright (`@playwright/test`, browsers cached) plus `wrangler dev` against the real built Worker closed the browser gap that blocked every prior session — see `e2e/checkpoint-3-evidence.spec.ts` and `references/checkpoint-3-captures/` for the 375×812/768×1024/1440×900 + reduced-motion captures and the keyboard tab-order audit. No visual-parity defect found. Task 3.6's preview URL is live (human-approved `wrangler deploy`, no route/domain attached): `https://9b3b6305-solbo-astro7-cloudflare.nickgagne92.workers.dev/link/`.
- **Checkpoint 3 approved by the human on 2026-08-07** (reviewed the live `/link` preview in-browser first). The WCAG AA contrast question was resolved: keep the legacy-inherited contrast as-is, an accepted parity exception. One item still carried forward, not blocking: the Task 3.1 `ponytail:` marker in `Music.astro`, unreachable until Task 5.2 supplies real release URLs.
- **Task 4.1 complete.** `src/lib/motion/lifecycle.ts` is the shared Lenis/GSAP/ScrollTrigger engine for `/` only (route-scoped, `/link` untouched); idempotent init guarded via a `data-motion-lifecycle` attribute on `<html>`, clean `pagehide`/`pageshow` teardown-and-reinit for bfcache restores, reduced-motion skip leaves native scroll untouched. `gsap`/`lenis` added as exact-pinned deps. This is the first task in the migration to ship any client JavaScript; built output verified directly (one script tag on `/`, zero React markers in it, zero script tags on `/link`), not inferred. Evidence: `e2e/task-4.1-motion-lifecycle.spec.ts`.
- **Task 4.2 complete.** `src/lib/motion/heroSequence.ts` is the Hero canvas engine: progressive frame loading, DPR-capped cover-fit draw, nearest-frame fallback, mobile pre-entry lock + enter behavior, per-breakpoint ScrollTrigger scrub, reduced-motion static path, own bfcache reinit. Real AVIF sequences now ship (193 mobile @ 1176×1080, 233 desktop @ 1920×1080, both crf32 per Task 1.3), replacing the empty canvas. `lifecycle.ts` gained `pauseMotion()`/`resumeMotion()` (Lenis's own `stop()`/`start()`) and `initMotionLifecycle()` now returns whether it actually activated. Found and removed in passing: `public/frames-mobile/` (the old 233%-over-budget JPEG sequence Task 1.4 rejected) was still tracked and shipping in every build. Two self-found bugs (Lenis-vs-preventDefault scroll lock, missing bfcache reinit) plus one reviewer-found critical bug (mobile frame-completion math finished at 100% of scroll instead of the intended 64%, a GSAP timeline-duration trap) were all fixed and empirically re-verified. Confirmed but NOT fixed (a framing/content decision, not a code defect): the desktop crop shows no visible motion for this specific footage in its exact center-cropped region — flag this for the human before Checkpoint 4. Evidence: `task-4.2-hero-sequence.md`, `e2e/task-4.2-hero-sequence.spec.ts`. Full regression suite 22/22 passing. **Task 4.3 (port section timelines) is the active task** — Hero's own content-reveal choreography (headline fade, scroll cue, canvas melt-exit) was deliberately deferred here to land together with Music/Shows/Footer's timelines in one pass; see the task-4.2 evidence doc's task-splitting note for why.
- A stale `wrangler dev` process from mid-session testing was killed and a fresh one manually restarted (still running, PID varies, port 4321) to unblock a webServer-startup race between Playwright and a concurrent `npm run build`. If tests hang on webServer startup again, check `Get-Process node` for a stuck instance before assuming a real regression.
- Task 2.4 blocker, precisely: `astro.config.mjs` has no `site` value, so every canonical/`og:url`/`twitter:image` branch in `src/layouts/BaseLayout.astro` evaluates to `undefined` and emits nothing. It is a one-line config fix once the human supplies the final public domain. Everything else in 2.4 is done. Close it in place the moment the domain arrives, whatever task is running.
- `@astrojs/react` is installed and enabled **only** so Keystatic's admin UI can run later. Public routes must still ship zero React bytes — verify per build, do not assume.
- `src/content/shows/` and `src/content/releases/` are intentionally empty until Task 5.2. Do not seed them with invented records.
- Correction (2026-08-06): the tracked modifications are **not** unrelated work. `.gitignore`, `.nvmrc`, `README.md`, `postcss.config.mjs`, `tsconfig.json`, `package.json`, and `package-lock.json` are all Task 2.1 migration edits, verified by diff. What must stay out of task commits is the untracked junk (`NUL`) and the large Hero source media under `public/images/` and `public/videos/`, which belong to Phase 4.
- Phase 2 shipped code but never committed it: all of `src/` is still untracked. A "Task 3.1 only" commit therefore needs the foundation committed first.
- Node is not on PATH as the pinned version. Prefix every command: `$env:PATH="C:\Users\Chance\AppData\Roaming\fnm\node-versions\v22.12.0\installation;"+$env:PATH`. Without it the shell uses Node 25 and `npm test` silently behaves differently.
- No production Cloudflare, DNS, Vercel, Supabase, or GitHub mutation is authorized.

## This session's goal amendment

The session goal is: a design that runs better and feels more fluid on Astro, plus a basic CMS the client can operate, executed by Claude Code sub-agents under ponytail.

This adds **no new phases**. It sharpens the acceptance bar on tasks that already exist:

| Session goal | Where it lands | Concrete bar |
|---|---|---|
| Fluid, optimized design | Tasks 3.1–3.5, 4.1–4.5 | Prerendered `/`, zero public React, CSS/native motion before any JS library, AVIF hero per the Checkpoint 1 decision, reduced-motion and no-JS paths intact |
| Basic CMS for the client | Tasks 5.1–5.4 | Shows, releases, links, and site copy editable in Keystatic with no terminal access; edit → preview → publish → rollback proven by a non-developer |
| Sub-agent + ponytail loop | This file | Sections below |

**Open decision for the human — CMS timing.** Task 5.1 (production Keystatic config) currently sits behind Checkpoints 2, 3, and 4. If you want the client editing content sooner, the safe variant is to bring up Keystatic in local mode against the existing `src/content/` collections right after Checkpoint 2, and defer GitHub-mode auth to 5.1 unchanged. That is a reorder, so it needs your explicit approval. Default if you say nothing: keep the plan order.

## Session start

1. `/ponytail full`.
2. `git status --short`. Note the unrelated changes so they stay out of every commit.
3. Read the active task section of `plan.md` and its line in `todo.md`. Nothing else until you know what the task touches.
4. `TodoWrite` one item per acceptance checkbox of the active task. The task is done when those are checked with evidence, not when the code looks right.
5. Never start a task that sits behind an unapproved checkpoint.

## Sub-agent policy

This plan is strictly sequential and checkpoint-gated, so parallel implementation agents would fight each other over the same files and produce a diff nobody can review. **Implementation stays on the main thread.** Sub-agents are used in exactly three places:

| When | Agent | Why it earns the spawn |
|---|---|---|
| Research fan-out — locating legacy Next.js source, reference captures, or "where does X live" across many files | `Explore` | Read-only, returns the conclusion instead of flooding context with file dumps |
| Pre-commit review of a completed task diff | `agent-skills:code-reviewer` | Independent eyes that do not share the assumptions that produced the code |
| Task 6.3 only — CSP, security headers, edge behavior | `agent-skills:security-auditor` | Genuinely different expertise from the porting work |

Do not spawn an agent per task, do not spawn agents to write migration code in parallel, and do not spawn one to do something a single `Grep` answers.

Use skills, not agents, for:

- `/ponytail-review` — before every commit, on the task diff.
- `agent-skills:browser-testing-with-devtools` — viewport, runtime, console, and no-JavaScript verification from Phase 3 onward.
- `/ponytail-debt` — at each checkpoint, to surface every `ponytail:` shortcut left behind before the human approves.

## Per-task loop

1. Confirm the task is not behind an unapproved checkpoint.
2. Read the task and the smallest necessary implementation context.
3. State the scope and acceptance criteria before editing. Surface assumptions; if two readings of the task produce materially different work, ask.
4. Implement only that task, at the highest rung of the ponytail ladder that holds. Mark deliberate simplifications with a `ponytail:` comment naming the ceiling and the upgrade path.
5. Verify every acceptance criterion with reproducible evidence — see the matrix below. "Looks right" is not evidence.
6. `/ponytail-review` the diff, then `agent-skills:code-reviewer` for anything beyond a config line. Apply only safe feedback inside the active task.
7. Re-run the affected checks after review changes.
8. Update `todo.md` and the task's evidence file.
9. Commit only the active task, focused message, no unrelated worktree changes.
10. Move on only if the task is verified, documented, committed, and not gated.

## Verification matrix

| Change type | Required evidence |
|---|---|
| Any Astro change | `npm run check` and `npm run build` both clean |
| Visual/port work | 375×812, 768×1024, 1440×900 captures, plus keyboard focus and reduced-motion review |
| Public route | Zero React runtime in the built output; check the emitted assets, do not infer it |
| `/link` | Works with JavaScript disabled, ≤200 KiB initial transfer, no hero-sequence request |
| Hero | Poster-first, scroll never trapped, media-failure and reduced-motion paths, real-device pass |
| CMS/edge | Authenticated editorial flow, preview deploy, a failed build, and a rollback — with no secret printed anywhere |

Budgets are in `plan.md`. Lighthouse is three runs, median.

## Checkpoint rules

Stop and request explicit human approval at Checkpoint 2 (foundation), 3 (static parity and production `/link`), 4 (motion and accessibility), 5 (client editorial UAT), 6 (release candidate and cutover authorization), and 7 (observation complete, old infrastructure retirement).

Silence, a generic "continue," or approval of one artifact is not checkpoint approval.

## Hard rules

- Client-owned GitHub/Keystatic access, Cloudflare ownership, the production domain, and all secrets come from the human. Never guess them, never print them, never commit them.
- Never expose server credentials to browser code.
- Never mutate DNS, production routes, Vercel, or Supabase before the matching Phase 7 task and its checkpoint.
- Final Spotify, SoundCloud, ticket, booking, social, and `/link` destinations must be supplied or approved. Do not invent them.
- Font conversion or subsetting requires confirmed rights. The site uses system fallbacks until the human supplies the web embed.
- Keep the Next.js + Supabase + Vercel production path intact and recoverable through the Phase 7 observation window.
- Do not add Markdoc-authored content. Keystatic's transitive `@markdoc/markdoc` dependency is allowed; authored Markdoc is not.

## Final handoff gate

Before declaring the migration complete: check/build clean with no console errors; `/` and `/link` pass the visual, responsive, accessibility, performance, and no-JavaScript expectations; the hero degrades to its poster without trapping scroll and respects reduced motion; a non-developer has proven edit → preview → publish → rollback; all real content and metadata are verified; security/cache headers, CMS no-index, SSL, DNS, and rollback are verified; `docs/client-guide.md` is written in plain language; and the 7–14 day observation window is complete before any old infrastructure is retired.
