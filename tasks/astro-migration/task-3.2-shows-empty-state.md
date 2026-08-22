# Task 3.2 amendment — Shows empty-state visual parity

**Superseded 2026-08-22 by the user-approved Signal Board and Vercel fallback restoration.**

## Cause

The prior Next build rendered a full Shows list even when its API had no
records because it fell back to `data/mock.ts`. Those five entries are
hard-coded 2025 sample dates with `example.com` ticket links. The Astro
application deliberately does not publish them: `src/content/shows/` stays
empty until Task 5.2 supplies real, approved records.

That content-safe decision left the initial Astro empty state as one short
line, losing the visual density that the prior mock list had provided.

## Supersession

The empty-state capture remains historical evidence only. The user explicitly
requested the prior Vercel five-row fallback, including its 2025 sample dates
and `example.com` ticket links, then approved the Signal Board treatment for
that content. The current implementation is documented in
`task-3.2-shows-signal-board.md`.

## Verification

| Check | Result |
| --- | --- |
The captures below remain historical evidence of the superseded treatment:

- `references/task-4.3-shows-timeline/desktop-1440x900-empty-state.png`
- `references/task-4.3-shows-timeline/mobile-375x812-empty-state.png`
