# Gemini Prompt: Hero Social Logo Polish

Paste this entire prompt into Gemini.

## Goal

Polish the hero section social links without changing the overall page structure. Use real brand-colored social logos, remove the rounded social-logo backgrounds, replace the desktop tagline under the headline with a social-logo row, and make the mobile hero buttons feel bulkier and slightly translucent using the style of a bullet proof glass card and with the same opacity as the spotify card with the rounded corners of the social cards.

This is a focused design implementation task. Do not redesign unrelated sections.

## Project Context

- Stack: Next.js, React, TypeScript, GSAP, Tailwind.
- Main file: `components/sections/Hero.tsx`.
- Social data source: `mockLinks` in `data/mock.ts`.
- Existing social icon asset map in `Hero.tsx`: `SOCIAL_ICON_SRC`.
- Existing assets:
  - `public/images/facebook.svg`
  - `public/images/insta.svg`
  - `public/images/soundcloud.svg`
  - `public/images/spotify.svg`
  - `public/images/tiktok.svg`

## Required Changes

### 1. Replace Social SVGs With Brand-Colored Logos

Replace the five SVG files in `public/images/` with clean brand-colored marks:

- Spotify: green mark using `#1DB954`
- SoundCloud: orange mark using `#ff5500`
- Facebook: blue mark using `#1877F2`
- Instagram: gradient mark if practical; otherwise a clean multi-color or brand-magenta fallback
- TikTok: tri-color mark if practical; otherwise a clean dark mark with cyan/red accent treatment

Requirements:

- No circular, rounded-square, pill, or filled background shape inside the SVGs.
- Keep each SVG visually centered.
- Use consistent viewBox sizing across the set where practical.
- Preserve the existing file names so `SOCIAL_ICON_SRC` does not need a data-shape change.

### 2. Mobile Intro Social Row

In `components/sections/Hero.tsx`, the mobile intro social row currently renders the logos inside frosted rounded circles.

Update it so:

- The rounded-circle chrome is removed.
- The visible mark is the bare brand logo.
- Tap targets remain at least 44px by 44px.
- The row has comfortable spacing and no visual button backgrounds.
- Active/press feedback remains subtle, such as a small scale change or opacity shift.

Do not remove accessibility attributes or external-link safety attributes.

### 3. Desktop Hero: Replace Tagline With Social Logo Row

The desktop hero has a tagline paragraph under the headline. Replace that paragraph with a horizontal social-logo row using all five `SOCIAL_LINKS`.

Requirements:

- The row occupies the same conceptual position as the old tagline: under the main headline, before the scroll indicator/footer area.
- Use the brand-colored SVG assets from `SOCIAL_ICON_SRC`.
- Do not use lucide fallback icons for the known five platforms.
- Use accessible labels from the link data.
- Add polished hover states: slight lift, opacity/color clarity, or scale, but no large background cards.
- Keep desktop composition balanced at 1440px wide.

Important GSAP requirement:

- The old tagline uses `descRef` and participates in the hero GSAP timeline.
- Move `descRef` to the new social-logo row, or replace it with an equivalent ref and update every GSAP content array that references it.
- The row must animate in and out wherever the old tagline did.

### 4. Mobile Buttons: Bulkier + Slightly Translucent

Update the mobile intro controls:

- Social row tap targets
- Spotify stream card
- "See website" pill

Design direction:

- Slightly taller/bulkier touch targets.
- Use translucent fills where there is currently a solid fill, roughly `70%` to `80%` opacity.
- Add or preserve `backdrop-blur` where it improves legibility.
- Keep text readable and avoid making controls look disabled.
- Preserve the existing mobile hierarchy: profile image, name/title, socials, Spotify card, website entry button.

## Constraints

- Do not edit unrelated sections.
- Do not remove the existing hero GSAP behavior.
- Do not introduce a new icon library.
- Do not change the social link data shape.
- Keep accessibility intact: labels, focus visibility, tap target size, and external-link attributes.
- If official brand SVG source material is unavailable, create clean inline SVG approximations that match the brand colors and avoid background shapes.

## Verification

Run:

```bash
npm run build
```

Visual checks:

- At 375px wide:
  - Social logos are bare brand marks, not icons inside circles.
  - Tap targets are comfortable.
  - Spotify card and "See website" button are bulkier and slightly translucent.
  - No text overlap or cramped controls.

- At 1440px wide:
  - The tagline under the headline is replaced by the five-logo social row.
  - The row feels intentional, aligned, and not card-heavy.
  - Hover states work without adding rounded icon backgrounds.

Animation checks:

- Hero GSAP entrance still animates the new social row.
- Scroll/scrub behavior does not throw console errors.
- No hydration, image, or TypeScript errors.

## Acceptance Criteria

- All five social logos render in brand colors with no rounded logo backgrounds.
- Desktop tagline is replaced by an animated social-logo row.
- Mobile controls are visibly bulkier and slightly translucent.
- `npm run build` passes.
- No app code outside the hero/social asset surface is changed.
