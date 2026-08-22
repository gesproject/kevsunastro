# Repository rules — Astro / Cloudflare migration

## Scope

- Work on `migration/astro-7-cloudflare`; keep the current Next.js + Supabase + Vercel production path intact until the approved cutover task.
- The project root is the Astro application. Do not create a second nested app.
- Follow the gated order in `tasks/astro-migration/plan.md` and record each completed task in `tasks/astro-migration/todo.md`.
- Execute through `tasks/claude-loop.md`; it defines the session start, sub-agent, review, and checkpoint procedure.

## Stack and runtime

- Use Node `22.12.0` and npm `10.9.0` as pinned in `.nvmrc`, `package.json`, and the lockfile.
- Verify migration changes with `npm run check` and `npm run build`.
- The production target is Astro server output through `@astrojs/cloudflare`, with explicit `nodejs_compat` and no route or DNS mutation until Phase 7.

## Public-site constraints

- Public routes are Astro-first: no React island unless a measured exception is explicitly approved.
- Keep cinematic source assets in versioned static storage; do not put Hero sequences in Keystatic.
- `/` is the cinematic homepage and `/link` is the dedicated social hub.
- Do not add Markdoc without an approved rich-text requirement.
- Honor reduced motion, preserve native scrolling, and keep semantic no-JavaScript content available before animation work.

## Safety

- Never commit credentials or print secret values.
- Do not mutate production Cloudflare, DNS, Vercel, Supabase, or GitHub ownership settings outside their approved migration tasks.
- Preserve unrelated worktree changes and commit only the current numbered migration task.
