# Gemini Prompt: Music Player Mockup Polish

Paste this entire prompt into Gemini.

## Goal

Polish the Music section player area so it still fits the approved layout, but the mock players more closely resemble real Spotify and SoundCloud embeds. Keep the existing shadow depth, remove the rounded border/card treatment around the two player mockups, and preserve dimensions so the later iframe swap is drop-in.

This is a focused design implementation task. Do not redesign unrelated sections.

## Project Context

- Stack: Next.js, React, TypeScript, GSAP, Tailwind.
- Main file: `components/sections/Music.tsx`.
- Current player helper: `WaveformBar`.
- Current mock player area:
  - Outer embeds container has `rounded-xl`, border classes, shadows, and backdrop blur.
  - `WaveformBar` has inline `borderRadius: "6px"` and `md:border`.
- Existing artwork asset to reuse:
  - `/images/mecca-solbo.png`
- Existing layout intent:
  - Desktop: Spotify square on the left, SoundCloud rectangle plus socials on the right.
  - Mobile: stacked layout.
  - Spotify footprint currently uses `height: clamp(152px, 20vw, 352px)`.
  - SoundCloud footprint currently uses `height: 166px`.

## Required Changes

### 1. Remove Rounded Border Treatment, Keep Shadows

Update the player mockup area so:

- The outer embeds container no longer uses the obvious rounded card border treatment.
- Remove `rounded-xl` from the embeds container.
- Remove the visible border classes from the embeds container.
- Keep the existing shadow depth, including mobile `shadow-2xl` and the desktop layered shadow.
- Keep backdrop blur/background treatment where it helps the section retain depth.

For the inner player mockups:

- Remove `WaveformBar` inline `borderRadius`.
- Remove inner visible border classes.
- Keep subtle shadow/inset depth only where it supports the real-embed look.

### 2. Replace Abstract Waveform Mockups With Realistic Embed Mockups

Replace the abstract `WaveformBar` look with two realistic mock player components or equivalent JSX:

#### Spotify Mockup

Design it like a real Spotify embed card:

- Dark base, close to `#121212`.
- Reuse `/images/mecca-solbo.png` as album artwork.
- Include track title and artist text.
- Include a green circular play button using Spotify green `#1DB954`.
- Include a progress bar/scrubber.
- Include a small Spotify wordmark or text label.
- Keep the same square footprint so Task 8 can later swap to a Spotify iframe without layout churn.

#### SoundCloud Mockup

Design it like a real SoundCloud embed:

- Reuse `/images/mecca-solbo.png` as artwork.
- Include an orange play button using `#ff5500`.
- Include title/artist text.
- Include a wide waveform area resembling the SoundCloud player.
- Include SoundCloud branding text or wordmark.
- Keep the same 166px height footprint so Task 8 can later swap to a SoundCloud iframe without layout churn.

The goal is not pixel-perfect brand cloning. It should be visually close enough that replacing the mockups with public iframes later does not feel like a design shift.

### 3. Preserve Layout Skeleton

Keep the approved section layout:

- Do not move the Music section heading.
- Do not change the shader/background system.
- Preserve desktop left/right player relationship.
- Preserve mobile stacking.
- Preserve the desktop socials area below/right of the SoundCloud mockup.
- Do not make the players into floating nested cards.

### 4. Responsive and Accessibility Requirements

- At mobile widths, player text must not overflow or overlap.
- At desktop widths, the Spotify square and SoundCloud rectangle should align cleanly.
- Use semantic links/buttons only where they actually navigate or act.
- If the mock play buttons are decorative/non-functional, mark them appropriately or make them non-interactive.
- Do not add fake functionality that suggests audio playback works before iframe integration.

## Constraints

- Do not implement real Spotify or SoundCloud iframes in this task.
- Do not change Supabase or production migration logic.
- Do not edit unrelated sections.
- Do not remove the existing social links below the player area.
- Preserve GSAP refs and animations in the Music section.
- Keep current dimensions compatible with later Task 8 iframe embeds.

## Verification

Run:

```bash
npm run build
```

Visual checks:

- At 375px wide:
  - Players stack cleanly.
  - Text fits inside the mock players.
  - No borders or rounded outer player card treatment remains.
  - Shadows/depth still make the section feel intentional.

- At 1440px wide:
  - Spotify mockup remains square on the left.
  - SoundCloud mockup remains 166px tall on the right.
  - Social links below/right still fit the layout.
  - The mockups resemble real embeds closely enough for a later iframe swap.

Animation checks:

- Music section GSAP entrance behavior still works.
- No console errors.
- No hydration or TypeScript errors.

## Acceptance Criteria

- Outer and inner player border/radius treatment is removed.
- Existing shadow depth is preserved.
- Spotify and SoundCloud mockups resemble real embed layouts.
- Existing responsive layout skeleton remains intact.
- `npm run build` passes.
- No production data, Supabase, or iframe work is included in this task.
