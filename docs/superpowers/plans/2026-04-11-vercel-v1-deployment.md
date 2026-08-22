# Vercel v1 Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy a clean, client-ready v1 of the Sölbo website to Vercel with mock data, passing build, and shareable preview URL.

**Architecture:** Static Next.js 16 app (single route `/`) deployed via Vercel CLI. All data is hardcoded in `data/mock.ts`. Supabase client is a commented placeholder — no backend wired up for v1.

**Tech Stack:** Next.js 16, React 19, GSAP, Tailwind v4, TypeScript, Vercel CLI

---

## File Map

| File | Action | Reason |
|------|--------|--------|
| `.gitignore` | Modified ✅ | Added `.claude/`, `.superpowers/` |
| `components/gsap/MusicShaders.tsx` | Deleted ✅ | Unused |
| `components/ui/background-paper-shaders.tsx` | Deleted ✅ | Unused |
| `components/gsap/useImageDrop.ts` | Deleted ✅ | Unused |
| `public/*.svg` (5 defaults) | Deleted ✅ | Next.js placeholders |
| `next.config.ts` | Modify | Add `images.unoptimized` for static export safety |
| `.env.local` | Create | Local env with dummy Supabase values for build |
| `vercel.json` | Create | Project config for Vercel |

---

### Task 1: Verify clean build state

**Files:**
- No changes — verification only

- [ ] **Step 1: Confirm deleted files are gone**

```bash
ls components/gsap/
ls components/ui/
```

Expected output:
```
components/gsap/:
MusicBackground.tsx  MusicFooterShell.tsx  WavesBackground.tsx  useScrollAnimations.ts

components/ui/:
shows-list.tsx  wave-loader.tsx
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors)

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: `✓ Generating static pages` with no errors or warnings

- [ ] **Step 4: Commit current clean state**

```bash
git add -A
git commit -m "chore: cleanup dead code and assets for v1 deployment"
```

---

### Task 2: Create local .env for build

**Files:**
- Reference: `.env.local.example`
- Create: `.env.local`

- [ ] **Step 1: Read the example env file**

```bash
cat .env.local.example
```

- [ ] **Step 2: Create .env.local with dummy values**

Copy `.env.local.example` to `.env.local`. It should contain:

```env
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
```

Use the exact dummy values already in `.env.local.example`.

- [ ] **Step 3: Verify .env.local is gitignored**

```bash
grep ".env" .gitignore
```

Expected: `.env*` line present — confirms `.env.local` will not be committed.

- [ ] **Step 4: Run build with env to confirm no env errors**

```bash
npm run build
```

Expected: same clean build as Task 1.

---

### Task 3: Add vercel.json project config

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create vercel.json**

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "outputDirectory": ".next"
}
```

Save to project root as `vercel.json`.

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "chore: add vercel.json project config"
```

---

### Task 4: Install Vercel CLI and link project

**Files:**
- No file changes

- [ ] **Step 1: Install Vercel CLI globally**

```bash
npm i -g vercel
```

Expected: installs without errors. Verify with:
```bash
vercel --version
```

- [ ] **Step 2: Log in to Vercel**

```bash
vercel login
```

Follow the prompt — select `Continue with Email` or your preferred auth method. Browser will open for confirmation.

- [ ] **Step 3: Link project to Vercel**

```bash
vercel
```

Answer the prompts:
- `Set up and deploy?` → **N** (we just want to link, not deploy yet)
- `Which scope?` → select your account
- `Link to existing project?` → **N** (create new)
- `Project name?` → `solbo` (or `kev-sun`)
- `Directory?` → `.` (current directory)

This creates a `.vercel/` folder locally (already gitignored).

---

### Task 5: Set environment variables in Vercel dashboard

**Files:**
- No file changes

- [ ] **Step 1: Open Vercel dashboard**

Go to vercel.com → your project → **Settings** → **Environment Variables**

- [ ] **Step 2: Add Supabase URL**

| Field | Value |
|-------|-------|
| Name | `NEXT_PUBLIC_SUPABASE_URL` |
| Value | `https://placeholder.supabase.co` |
| Environments | Production, Preview, Development |

- [ ] **Step 3: Add Supabase anon key**

| Field | Value |
|-------|-------|
| Name | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Value | `placeholder-anon-key` |
| Environments | Production, Preview, Development |

- [ ] **Step 4: Save both variables**

Click **Save** after each. Confirm both appear in the list.

---

### Task 6: Deploy preview to Vercel

**Files:**
- No file changes

- [ ] **Step 1: Run preview deploy**

```bash
vercel
```

Expected output ends with:
```
✅  Preview: https://solbo-xxxxxxx.vercel.app
```

- [ ] **Step 2: Open the preview URL in browser**

Check all 4 sections load:
- Hero (frame sequence animation plays)
- Shows (list renders with mock data)
- Music (releases grid renders)
- Footer (waves animation plays)

- [ ] **Step 3: Check browser console for errors**

Open DevTools → Console. Expected: zero errors.

- [ ] **Step 4: Check mobile view**

In DevTools → toggle device toolbar → iPhone 14 size. Confirm layout is not broken.

---

### Task 7: Promote to production

**Files:**
- No file changes

- [ ] **Step 1: Promote preview to production**

```bash
vercel --prod
```

Expected output ends with:
```
✅  Production: https://solbo.vercel.app
```

- [ ] **Step 2: Verify production URL**

Open the production URL. Confirm same checks as Task 6 Step 2.

- [ ] **Step 3: Share URL with client**

Send the production Vercel URL (`https://solbo.vercel.app` or similar) to the client for v1 review.

---

## Post-Deploy: Phase 2 Checklist (for reference)

When client approves v1, the next phase is Supabase integration:

- [ ] Create Supabase project at supabase.com
- [ ] Create tables: `shows`, `releases`, `links`, `content`
- [ ] Migrate `data/mock.ts` data into Supabase
- [ ] Wire up `lib/supabase.ts` with real credentials
- [ ] Replace mock imports in `Hero.tsx`, `Shows.tsx`, `Music.tsx`, `Footer.tsx`
- [ ] Update Vercel env vars with real Supabase URL and anon key
- [ ] Redeploy with `vercel --prod`

---

## Success Criteria

- [ ] `npm run build` passes with 0 errors
- [ ] `vercel` preview deploy succeeds
- [ ] All 4 sections render correctly on preview URL
- [ ] Zero browser console errors
- [ ] Mobile layout intact
- [ ] `vercel --prod` production URL live and shareable
