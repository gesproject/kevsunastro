# Cinematic Mobile Seams — Design Spec

**Date:** 2026-05-11
**Status:** Approved — ready for implementation plan
**Goal:** Unify the mobile experience so the site reads as one continuous film, not four AI-default sections glued together.

---

## North Star

The site should feel **cinematic** — the visual language of film titles and movie posters: slow tempo, generous space, restrained motion, deliberate color grading, kerned typography. Hero already speaks this dialect well. Everything else must be tuned to match it.

Hero is the **reference scene**, not a redesign target.

---

## Scope

In-scope:
- 3 mobile seams: **Hero → Music**, **Music → Shows**, **Shows → Footer**
- Music section, Shows section, Footer — internal tuning needed to make the seams work
- 2-3 signature cinematic moves shared across seams

Out-of-scope:
- Hero's interior (untouched — used as calibration reference)
- Desktop redesign (inherits whatever mobile improves; not the focus)
- New sections or new content
- Performance refactors unrelated to seam transitions

---

## Constraints

- **No git commits during sprints.** Code lands on disk; user reviews on a real mobile device; commits only after explicit approval.
- **Mobile-first.** Every fix is verified on a real mobile viewport before being considered done.
- **Smallest possible diff.** Edit existing files. No new components unless unavoidable.
- **≤2 files per seam.** If a seam fix touches more than 2 files, the abstraction is probably wrong — stop and re-audit.
- **Stop anywhere.** Each seam ships independently. Two-thirds of the work is still a shippable improvement.

---

## Workflow

### Phase 0 — Cinematic Vocabulary (~15 min)
Extract the cinematic dialect Hero already speaks. Write it down as the calibration target.

**Deliverable:** a "Phase 0 — Cinematic Vocabulary" section appended to the bottom of this same spec file, containing
1. Pacing rules observed in Hero (enter/hold/exit durations, ease curves)
2. Color grade tokens (Hero's "film stock")
3. Mobile type rhythm (tracking, leading, weight for title moments)
4. Restraint list (what Hero refuses to do — and so neither does the rest of the site)
5. 3 candidate signature moves for seams (e.g. color-grade dissolve, title card wipe, scene-change pinch)

### Phase 1-3 — Seam Sprints (~30-45 min each)
Each seam runs the same 5-step loop:

```
1. AUDIT       → Open mobile viewport. Scroll the seam. Identify where the
                 cinematic illusion breaks (color jump, rhythm stutter, type
                 mismatch, motion clash).
2. DEFINE      → One paragraph naming the cinematic moment this seam delivers.
                 Pick ONE signature move from Phase 0's candidate list.
3. IMPLEMENT   → Edit existing files. Mobile-first. Smallest diff possible.
4. VERIFY      → Chrome DevTools mobile emulation is fine here for speed.
                 Scroll the seam 3 times. Illusion holds?
5. SHOW LOCALLY → No git commit. User reviews in dev server / on phone.
                  Decision: keep, tweak, or revert.
```

| Sprint | Seam | Notes |
|--------|------|-------|
| 1 | Hero → Music | Touches Hero's **exit only**. Hero interior stays. |
| 2 | Music → Shows | Heaviest lift — both sections may need internal tuning. |
| 3 | Shows → Footer | Closing moment of the film. Should feel like end credits. |

**Stop conditions for a sprint:**
- Fix requires changing Hero's interior → escalate, user decides
- Diff exceeds 2 files → re-audit, wrong abstraction
- Verification fails twice → the cinematic moment is wrong for this seam

### Phase 4 — Final Walkthrough (~15 min)
Open the site on a real device. Scroll top-to-bottom **once, without stopping**. The question: does it feel like one film, or three scenes glued together?

- Feels like one film → user decides what/when to commit
- Feels glued → identify the fighting seam, run one mini-sprint

---

## Skill Stack

| Phase | Skill | Purpose |
|-------|-------|---------|
| 0 | `superpowers:brainstorming` | Already in flight — produces this spec |
| 0→1 | `superpowers:writing-plans` | Convert spec into ordered seam sprint tasks |
| 1-3 | `agent-skills:browser-testing-with-devtools` | Mobile audit + verification |
| 1-3 | `agent-skills:frontend-ui-engineering` | Implementation |
| 1-3 | `superpowers:verification-before-completion` | No "done" claims without browser proof |
| 1-3 | `superpowers:executing-plans` | Per-seam review checkpoints |
| 4 | `superpowers:finishing-a-development-branch` | Commit/push decisions, only after user approval |

---

## Deliverables

- This spec (`2026-05-11-cinematic-mobile-seams.md`)
- A Phase 0 vocabulary addendum (extracted from Hero)
- An implementation plan (output of `writing-plans`, covers Phases 1-3)
- 3 seam improvements in working tree, each independently revertable
- 0 git commits until user explicitly approves

---

## Estimated Time

~2 hours total: 15 min (Phase 0) + 3 × 30-45 min (Sprints) + 15 min (Phase 4).
Naturally bounded. Stop anywhere; prior work is still shippable.

---

## Phase 0 — Cinematic Vocabulary (extracted from Hero)

### Pacing
- **Enter duration:** scrub-based (not time-based) — content fades in over the first 25-30% of scroll travel (`duration: 0.25–0.3` in scrub units, stagger `0.05–0.06`)
- **Hold:** content is fully visible from ~30% to ~80% of scroll travel with no further animation
- **Exit duration:** content exits over ~15-18% of scroll travel (`duration: 0.15–0.18` in scrub units); canvas "melt" exit is tighter at `duration: 0.1`
- **Scrub lag:** `scrub: 0.8` — a deliberate 800ms follow lag that gives motion a weighted, unhurried feel
- **Signature ease:** `power2.out` (enter), `power2.in` (exit), `power2.inOut` (canvas melt) — the `power2` family is the only easing family used

### Color Grade (the "film stock")
- **Base background:** `#c8cbc8` (a cool, slightly warm grey — muted silver)
- **Mobile vignette:** `rgba(14,14,12,0.7)` fading to `#0e0e0c` at the bottom — near-black with a warm undertone
- **Primary text color (mobile):** `#e8e0d4` (warm cream/parchment)
- **Primary text color (desktop):** `solbo-dark` (Tailwind custom token — maps to dark/near-black)
- **Muted/secondary text:** `#e8e0d4` at 40–75% opacity; `solbo-dark` at 50–70% opacity
- **Accent rule:** none — Hero uses no accent color; all tones are achromatic or warm-neutral

### Mobile Type Rhythm
- **Title classes:** `font-bold tracking-tighter leading-[0.85] mb-3 overflow-hidden text-[#e8e0d4]` — font size `clamp(4.5rem, 18vw, 10rem)`
- **Body/tagline classes:** `text-[0.95rem] font-light max-w-[85vw] mb-5 leading-relaxed tracking-wider text-[rgba(232,224,212,0.75)]`
- **Nav/label classes:** `text-[0.75rem] uppercase tracking-[0.2em] font-medium` (desktop only, hidden on mobile)
- **Scroll label:** `text-[0.55rem] uppercase tracking-[0.5em] font-medium` — ultra-tight tracking for utility chrome
- **Air principle:** extremely generous — `leading-[0.85]` compresses the title block vertically, then the space below it (to tagline) uses `mb-3/mb-5`) creates clear breathing room; content is bottom-anchored with `pb-24` on mobile, so the top 2/3 of the viewport is open negative space occupied only by the film frame

### Restraint List (what Hero refuses)
- No bounce eases (`bounce`, `elastic`) — `power2` only, both directions
- No parallax on text (text opacity-fades out uniformly; no Y-travel differential between text layers on exit — stagger is minimal at 0.03–0.06 scrub units)
- No color accent or brand color on any UI element — everything is cream, dark, or their opacities
- No entrance from off-screen (text starts `opacity: 0` in place, not translated in from a side or bottom beyond a negligible `y` value)
- No auto-play animation loops on content (only the scroll indicator line repeats; content is static once entered)
- No overlay cards, modals, or attention-grabbing UI chrome
- Canvas exits via `scale: 0.95` + `opacity: 0` — a subtle "pull back" melt, not a slide or wipe

### 3 Candidate Signature Moves for Seams
1. **Color-grade dissolve** — outgoing section's background color transitions into incoming section's background over the last 25% of the scroll range (~600ms).
2. **Letterbox pinch** — thin black bars (4px) briefly close from top/bottom over the seam (~200ms) then reopen on the new scene.
3. **Title card wipe** — incoming section's title starts at `opacity: 0, scale: 0.92` and resolves to full presence as the seam completes.
