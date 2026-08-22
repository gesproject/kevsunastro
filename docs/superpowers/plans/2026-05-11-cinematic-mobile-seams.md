# Cinematic Mobile Seams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the mobile experience so the site reads as one continuous cinematic film, by tuning the three section seams (Hero→Music, Music→Shows, Shows→Footer) to speak the dialect Hero already speaks.

**Architecture:** Hero is the immutable reference scene. We extract its cinematic vocabulary (pacing, color, type rhythm, restraint) into the spec, then run three independent seam sprints — each one ≤2 files, mobile-first, no auto-commits. User reviews each seam in the dev server before any git action.

**Tech Stack:** Next.js + GSAP + TypeScript. Chrome DevTools mobile emulation for verification. Existing `SmoothScroll` and section components untouched in structure.

**Spec:** `docs/superpowers/specs/2026-05-11-cinematic-mobile-seams.md`

**Hard constraints (from spec):**
- **No git commits during sprints.** Every task ends in "show locally + await user approval", never `git commit`.
- **≤2 files per seam.** If a sprint needs more, stop and re-audit.
- **Hero interior untouched.** Seam 1 may modify Hero's *exit only*.
- **Max 3 file reads per task** (project rule from AGENTS.md).

---

## File Map

| File | Role | Touched in |
|------|------|------------|
| `components/sections/Hero.tsx` | Reference scene (vocabulary source). Exit only may change. | Task 0 (read), Task 1 (exit) |
| `components/sections/Music.tsx` | Mid-film scene. Tunes entry to Hero, exit to Shows. | Task 1, Task 2 |
| `components/sections/Shows.tsx` | Mid-film scene. Tunes entry to Music, exit to Footer. | Task 2, Task 3 |
| `components/sections/Footer.tsx` | End credits. | Task 3 |
| `docs/superpowers/specs/2026-05-11-cinematic-mobile-seams.md` | Living spec — Phase 0 appends to it. | Task 0 |

---

## Task 0: Phase 0 — Extract Hero's cinematic vocabulary

**Files:**
- Read: `components/sections/Hero.tsx`
- Modify: `docs/superpowers/specs/2026-05-11-cinematic-mobile-seams.md` (append "Phase 0 — Cinematic Vocabulary" section at bottom)

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Leave running in background. Note the local URL (usually `http://localhost:3000`).

- [ ] **Step 2: Open Chrome DevTools mobile emulation on the Hero**

Open `http://localhost:3000` in Chrome. Open DevTools (F12). Toggle device toolbar (Ctrl+Shift+M). Pick a representative mobile preset (e.g. iPhone 14 Pro — 393×852). Scroll only within Hero. Observe.

Capture in a scratch note (mental or in a separate file — not the spec yet):
- **Pacing:** How long does Hero's enter animation take? Hold? Exit (if any visible)? Eyeball the durations.
- **Color:** What is Hero's dominant palette on mobile? Is there a tint/grade applied?
- **Type rhythm:** Title scale, tracking, leading. Weight. How much air around it?
- **Motion:** What moves? What is deliberately still? Any easing that feels signature?
- **Restraint:** What does Hero refuse to do (no bouncy ease, no parallax on body text, etc.)?

- [ ] **Step 3: Read Hero.tsx to confirm what you observed**

Read `components/sections/Hero.tsx`. Cross-reference observations with the actual GSAP timelines, eases, durations, color values, type classes. Do not modify Hero.

- [ ] **Step 4: Append the Phase 0 section to the spec**

Append the following section to the **bottom** of `docs/superpowers/specs/2026-05-11-cinematic-mobile-seams.md` (replace bracketed values with what you found in steps 2-3):

```markdown
---

## Phase 0 — Cinematic Vocabulary (extracted from Hero)

### Pacing
- **Enter duration:** [e.g. 1.2s]
- **Hold:** [e.g. 0.4s of stillness before scroll triggers exit]
- **Exit duration:** [e.g. 0.6s]
- **Signature ease:** [e.g. `power3.out` on enter, `power2.inOut` on exit]

### Color Grade (the "film stock")
- **Base palette:** [hex values used in Hero]
- **Background grade:** [tone/tint applied — e.g. warm sepia, cool steel, neutral grey]
- **Accent rule:** [where accent color is allowed — title? CTA? never on body?]

### Mobile Type Rhythm
- **Title:** [size / tracking / leading / weight]
- **Body:** [size / tracking / leading / weight]
- **Air ratio:** [eyeball — how much vertical space surrounds the title relative to its height]

### Restraint List (what Hero refuses)
- No [e.g. bounce eases]
- No [e.g. parallax on body copy]
- Never more than [e.g. 2 simultaneous motion elements]
- [add more as observed]

### 3 Candidate Signature Moves for Seams
Pick one per seam in Tasks 1-3.

1. **Color-grade dissolve** — outgoing section's color grade fades into incoming section's grade over ~600ms during the seam scroll.
2. **Letterbox pinch** — thin black bars briefly close from top/bottom over the seam (~200ms) and reopen on the new scene, mimicking a scene change in film.
3. **Title card wipe** — incoming section's title scales up from a small kerned state into final position, while outgoing section's last element fades and shifts slightly.
```

- [ ] **Step 5: Show locally + await user approval**

```bash
# DO NOT git commit.
```

Tell the user: *"Phase 0 vocabulary appended to the spec. Please read the new section at the bottom of `docs/superpowers/specs/2026-05-11-cinematic-mobile-seams.md` and approve before we start Seam 1."*

Wait for user confirmation. If they want changes, edit the appended section in place.

---

## Task 1: Seam 1 — Hero → Music

**Files (max 2):**
- Modify: `components/sections/Hero.tsx` (**exit only** — interior is locked)
- Modify: `components/sections/Music.tsx` (entry only)

**Cinematic moment to deliver:** TBD in Step 2 below — pick from Phase 0's 3 candidates based on what the audit reveals.

- [ ] **Step 1: Audit the seam on mobile**

Dev server still running. In Chrome DevTools mobile emulation (iPhone 14 Pro), scroll slowly through the boundary where Hero ends and Music begins. Scroll the seam 3 times. Capture:
- **Visible illusion break:** what specifically tells the viewer "this is a new section / a different site"? (e.g. hard color jump, motion clash, type weight discontinuity, white flash)
- **Rhythm check:** does the exit/enter timing match Phase 0's pacing rules? Or is one twice as fast as the other?
- **Single worst offender:** name the *one* thing that, if fixed, would do the most work.

- [ ] **Step 2: Define the cinematic moment in writing**

Before touching code, write one paragraph naming the cinematic moment this seam will deliver. Pick exactly ONE of the 3 candidate signature moves from Phase 0. Example:

> *"Hero's warm grade dissolves into Music's cooler grade across the last 25% of Hero's scroll range. Music's title card begins kerned and small at +20% into the seam and resolves into final position as Hero's grade has fully transferred. No letterbox here — this is a continuous dissolve, not a scene change."*

Paste this paragraph into the commit-message draft (you'll use it later when the user approves and commits).

- [ ] **Step 3: Implement, smallest diff possible**

Edit Hero's exit timeline and/or Music's entry timeline. Do NOT add new components. Do NOT touch Hero's interior animations or copy. Keep desktop behaviour intact (use GSAP `matchMedia` if introducing mobile-only timing).

Rules:
- If the diff exceeds 2 files, **stop** — your abstraction is wrong, return to Step 2.
- Use existing eases and color tokens from Phase 0. Don't invent new ones.
- Mobile-first; desktop inherits unless explicitly diverged.

- [ ] **Step 4: Verify in Chrome DevTools mobile**

Reload the page (or hot-reload). In iPhone 14 Pro emulation, scroll the seam 3 times. Answer:
- Does the illusion break from Step 1 still exist? It must not.
- Does the seam now feel like the cinematic moment from Step 2? It must.
- Did anything elsewhere regress? Spot-check Music's interior and Hero's interior.

If verification fails twice in a row, **stop** — the cinematic moment from Step 2 is wrong for this seam. Re-audit.

- [ ] **Step 5: Show locally + await user approval**

```bash
# DO NOT git commit.
```

Tell the user: *"Seam 1 (Hero→Music) implemented. Dev server is at `http://localhost:3000`. Please scroll the boundary on your phone or in mobile emulation and let me know: keep, tweak, or revert. No commit yet."*

If user says **keep** → leave changes on disk, move to Task 2.
If user says **tweak** → return to Step 3 with their feedback.
If user says **revert** → `git checkout -- components/sections/Hero.tsx components/sections/Music.tsx`, return to Step 2 with a different signature move.

---

## Task 2: Seam 2 — Music → Shows

**Files (max 2):**
- Modify: `components/sections/Music.tsx` (**exit only** — entry was tuned in Task 1)
- Modify: `components/sections/Shows.tsx` (entry only)

**Notes:** This is the heaviest seam — Music's exit must hand off cleanly to Shows' editorial parallax. Memory says Music's interior is approved/locked (clamp row height, Spotify square, SoundCloud rectangle, shader bg, 2-col releases). Do not touch Music's interior — only its exit motion.

**Cinematic moment to deliver:** TBD in Step 2 below — pick from Phase 0's 3 candidates.

- [ ] **Step 1: Audit the seam on mobile**

In Chrome DevTools mobile emulation, scroll the Music→Shows boundary 3 times. Capture:
- **Visible illusion break:** is there a hard background color jump (Music's shader bg → Shows' starting color)? Does Shows' photo panel pop in jarringly?
- **Rhythm check:** Music's exit speed vs Shows' entry speed — do they feel like one shot, or two?
- **Single worst offender:** name it.

- [ ] **Step 2: Define the cinematic moment in writing**

One paragraph naming the cinematic moment. Pick one of the 3 candidate moves. Example:

> *"The shader background of Music color-grades into Shows' opening tone over the last 20% of Music's scroll range. Shows' photo panel emerges at low opacity at the start of the dissolve and resolves to full presence as Music's bg fully transfers — like a cross-fade between two film stocks."*

- [ ] **Step 3: Implement, smallest diff possible**

Edit Music's exit timeline and/or Shows' entry timeline. Same rules as Task 1 Step 3.

**Hard rule from memory:** Music's interior (Spotify/SoundCloud cards, releases grid, clamp heights, shader bg parameters) is the approved baseline. Do not modify it. You may modify the **scroll-out** timeline that runs as Music exits.

- [ ] **Step 4: Verify in Chrome DevTools mobile**

Same as Task 1 Step 4. Critically, also spot-check Music's interior — the approved baseline must be unchanged.

If verification fails twice, stop and re-audit.

- [ ] **Step 5: Show locally + await user approval**

```bash
# DO NOT git commit.
```

Tell the user: *"Seam 2 (Music→Shows) implemented. Please review on mobile and let me know: keep, tweak, or revert."*

Same branching as Task 1 Step 5.

---

## Task 3: Seam 3 — Shows → Footer

**Files (max 2):**
- Modify: `components/sections/Shows.tsx` (**exit only**)
- Modify: `components/sections/Footer.tsx` (entry)

**Notes:** This is the closing moment of the film — the end-credits feel. Restraint matters most here. Shows' photo panel finishing animation and Footer's entrance must feel like one resolving cadence.

**Cinematic moment to deliver:** TBD in Step 2 below.

- [ ] **Step 1: Audit the seam on mobile**

Scroll the Shows→Footer boundary 3 times in mobile emulation. Capture:
- **Visible illusion break:** does Footer feel like a different site? Bg color jump? Type weight jump?
- **Rhythm check:** Shows ends on a parallax photo — does Footer's first frame arrive too fast, too late, or off-tempo?
- **Single worst offender:** name it.

- [ ] **Step 2: Define the cinematic moment in writing**

One paragraph. Pick one of the 3 candidates. For this final seam, lean toward restraint — a "fade to credits" rather than another color-grade dissolve, unless the audit insists otherwise.

- [ ] **Step 3: Implement, smallest diff possible**

Edit Shows' exit and Footer's entry. Same rules.

- [ ] **Step 4: Verify in Chrome DevTools mobile**

Scroll the seam 3 times. Confirm the closing cadence feels resolved, not abrupt.

If verification fails twice, stop and re-audit.

- [ ] **Step 5: Show locally + await user approval**

```bash
# DO NOT git commit.
```

Tell the user: *"Seam 3 (Shows→Footer) implemented. Please review on mobile and let me know: keep, tweak, or revert."*

---

## Task 4: Phase 4 — Full-film mobile walkthrough

**Files:** none modified by default. May trigger one mini-sprint if the walkthrough reveals a fighting seam.

- [ ] **Step 1: User opens the site on a real device**

Dev server still running (or rebuild + serve). User opens the local URL on their actual phone (not the emulator). The full top-to-bottom scroll happens **once, without stopping**.

- [ ] **Step 2: User answers one question — "Does it feel like one film?"**

If **yes** → proceed to Step 3.
If **no** → user names the fighting seam. Reopen the relevant task (1, 2, or 3) and run one mini-sprint targeting only that seam. Then re-run Step 1.

- [ ] **Step 3: User decides commit strategy**

Options to present to user:
- **Per-seam commits** (3 commits) — atomic history, each seam revertable independently.
- **One bundled commit** — single message: `feat(mobile): unify cinematic seams across Hero/Music/Shows/Footer`.
- **Hold for review** — don't commit yet, sleep on it, come back tomorrow.

Do NOT commit until the user has explicitly picked an option and said go.

- [ ] **Step 4: Execute the chosen commit strategy (only on user's explicit go)**

If per-seam commits chosen:

```bash
git add components/sections/Hero.tsx components/sections/Music.tsx
git commit -m "<seam 1 cinematic moment paragraph from Task 1 Step 2>"

git add components/sections/Music.tsx components/sections/Shows.tsx
git commit -m "<seam 2 cinematic moment paragraph from Task 2 Step 2>"

git add components/sections/Shows.tsx components/sections/Footer.tsx
git commit -m "<seam 3 cinematic moment paragraph from Task 3 Step 2>"

git add docs/superpowers/specs/2026-05-11-cinematic-mobile-seams.md docs/superpowers/plans/2026-05-11-cinematic-mobile-seams.md
git commit -m "docs: add cinematic mobile seams spec + plan"
```

(Note: per-seam strategy requires staging Music.tsx twice if Seams 1 and 2 both modified it — split using `git add -p` or accept that the first commit captures all Music edits and the second is structure-only.)

If bundled commit chosen:

```bash
git add components/sections/Hero.tsx components/sections/Music.tsx components/sections/Shows.tsx components/sections/Footer.tsx docs/superpowers/specs/2026-05-11-cinematic-mobile-seams.md docs/superpowers/plans/2026-05-11-cinematic-mobile-seams.md
git commit -m "feat(mobile): unify cinematic seams across Hero/Music/Shows/Footer"
```

Do not push. The user pushes when they're ready.

---

## Self-Review

- **Spec coverage:**
  - Phase 0 (vocabulary extract) → Task 0 ✓
  - Seam 1/2/3 sprints with 5-step loop → Tasks 1/2/3 ✓
  - Phase 4 walkthrough → Task 4 ✓
  - No-auto-commit constraint → Every Step 5 says "do not git commit" ✓
  - ≤2 files per seam → Stated in each task header + stop condition in Step 3 ✓
  - Hero interior untouched → Stated in Task 1 + Music interior protected in Task 2 ✓
  - Max 3 file reads per task → Largest task reads 2 files ✓
- **Placeholder scan:** Cinematic moment paragraphs are explicitly TBD-in-Step-2 — this is intentional, the moment is determined by the audit. Not a placeholder failure.
- **Type consistency:** No code symbols defined that need cross-referencing. Plan operates at the file-and-timeline level.
